// マモ拳（仮） オンライン対戦リレーサーバー(Cloudflare Workers + Durable Objects)
//
// サーバーはゲームロジックを一切持たない「WebSocketリレー」。1ルームコード=1
// Durable Objectインスタンスで、そのDOに接続した2クライアントを対戦者(side0/1)、
// 3人目以降を観戦者として扱い、対戦者間の生メッセージをそのまま転送する。
// 決定論ロックステップの実体(rngシード適用・入力バッファ・フレーム進行)は
// クライアント側(mulberry32)で完結させる。サーバーが生成する乱数はルーム確立時の
// 共有rngシード値そのもの(対戦開始のたび1回)に限られ、対戦シミュレーションには関与しない。
//
// 例外(v0.9 PR4「勝ち残り交代」): slot(誰が対戦者か)の入れ替えは各クライアント単独では
// 決定できないため、'matchOver'メッセージだけはサーバーが内容を解釈し、観戦者の昇格/
// 敗者の観戦降格と次戦の共有シード配布を行う。他の全メッセージ種別(cmd/pick等)は
// 従来通り意味を解釈せず生のまま中継するだけ。

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 0/O/1/I/L等の混同しやすい文字を除外

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return json({ ok: true, service: 'mamoken-relay' });
    }

    // ルームコード生成(クライアントが「作成」を選んだ時に叩く。実際のルーム実体は
    // 最初のWebSocket接続があった時点でDOが遅延生成するため、このエンドポイントは
    // 単に衝突しにくい4文字コードを1つ返すだけ)
    if (url.pathname === '/api/new-code') {
      let code = '';
      const bytes = new Uint8Array(4);
      crypto.getRandomValues(bytes);
      for (let i = 0; i < 4; i++) code += ROOM_CODE_ALPHABET[bytes[i] % ROOM_CODE_ALPHABET.length];
      return json({ code });
    }

    // WebSocket接続: /ws/{ROOMCODE}
    const m = url.pathname.match(/^\/ws\/([A-Za-z0-9]{1,8})$/);
    if (m) {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 });
      }
      const code = m[1].toUpperCase();
      const id = env.ROOMS.idFromName(code);
      const room = env.ROOMS.get(id);
      return room.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};

export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    // sessions: Map<WebSocket, {slot: 0|1|number}> — slot 0/1=対戦者、2以上=観戦者(入室順)
    this.sessions = new Map();
    this.seed = null; // 両対戦者が揃った時点で1回だけ生成し、以後は再利用(再接続時も同じ試合として扱う)
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  handleSession(ws) {
    ws.accept();
    const slot = this.assignSlot();
    this.sessions.set(ws, { slot });

    this.send(ws, { t: 'welcome', slot, isPlayer: slot < 2 });
    this.broadcast({ t: 'peerJoined', slot }, ws);

    if (this.seed == null && this.bothPlayersPresent()) {
      // 両対戦者が揃った瞬間にちょうど1回だけ生成し、全員(自分含む)へ送る
      this.seed = (crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0;
      for (const s of this.sessions.keys()) this.send(s, { t: 'ready', seed: this.seed });
    } else if (this.seed != null) {
      // 既に試合が始まっているルームへの後入室(観戦者・再接続): 既存クライアントへは
      // 再送しない。新規クライアントにだけ現在のseedを個別に伝える
      this.send(ws, { t: 'ready', seed: this.seed });
    }

    ws.addEventListener('message', (event) => {
      let msg = null;
      try { msg = JSON.parse(event.data); } catch (err) { /* JSONでなければ下のraw中継に任せる */ }
      if (msg && msg.t === 'matchOver') {
        this.handleMatchOver(ws, msg);
        return; // このメッセージはサーバー内部処理のみ。生のまま中継はしない
      }
      // それ以外(cmd/pick等)はペイロードの意味を解釈せず、他クライアントへそのまま中継するだけ
      this.broadcast(event.data, ws, true);
    });

    const onClose = () => {
      const info = this.sessions.get(ws);
      this.sessions.delete(ws);
      if (info) this.broadcast({ t: 'peerLeft', slot: info.slot }, ws);
    };
    ws.addEventListener('close', onClose);
    ws.addEventListener('error', onClose);
  }

  assignSlot() {
    const used = new Set(Array.from(this.sessions.values()).map((v) => v.slot));
    if (!used.has(0)) return 0;
    if (!used.has(1)) return 1;
    let n = 2;
    while (used.has(n)) n++;
    return n;
  }

  bothPlayersPresent() {
    const used = new Set(Array.from(this.sessions.values()).map((v) => v.slot));
    return used.has(0) && used.has(1);
  }

  // 勝ち残り交代(v0.9 PR4): 1試合終わるたびにslot0のクライアントだけが送ってくる
  // (二重送信を避けるため送信元を1人に固定)。観戦者がいれば入室順で最も早い1人を
  // 敗者と入れ替えて挑戦者に昇格させ、勝者はslotそのまま。最後に次戦の共有シードを配布する。
  handleMatchOver(ws, msg) {
    const info = this.sessions.get(ws);
    if (!info || info.slot !== 0) return;
    const winnerSlot = (msg.winnerSlot === 0 || msg.winnerSlot === 1) ? msg.winnerSlot : null;
    if (winnerSlot == null) return;
    const loserSlot = 1 - winnerSlot;

    let spectatorEntry = null;
    for (const entry of this.sessions) { // Mapは挿入順を保持するため、最初に見つかる観戦者が入室順で最も早い
      if (entry[1].slot >= 2) { spectatorEntry = entry; break; }
    }
    if (spectatorEntry) {
      let loserWs = null;
      for (const [w, i] of this.sessions) { if (i.slot === loserSlot) { loserWs = w; break; } }
      if (loserWs) {
        const [specWs, specInfo] = spectatorEntry;
        const loserInfo = this.sessions.get(loserWs);
        const vacatedSlot = specInfo.slot;
        specInfo.slot = loserSlot;
        loserInfo.slot = vacatedSlot;
        this.send(specWs, { t: 'yourSlot', slot: loserSlot });
        this.send(loserWs, { t: 'yourSlot', slot: vacatedSlot });
      }
    }

    this.seed = (crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0;
    for (const [w, i] of this.sessions) {
      if (i.slot === 0 || i.slot === 1) this.send(w, { t: 'ready', seed: this.seed });
    }
  }

  send(ws, obj) {
    try { ws.send(typeof obj === 'string' ? obj : JSON.stringify(obj)); } catch (err) { /* 切断済みは無視 */ }
  }

  broadcast(obj, exclude, isRaw) {
    const payload = isRaw ? obj : JSON.stringify(obj);
    for (const ws of this.sessions.keys()) {
      if (ws === exclude) continue;
      try { ws.send(payload); } catch (err) { /* 切断済みは無視(closeイベントで後片付けされる) */ }
    }
  }
}

# GitHub投入手順

この納品ZIPはすべて**repo rootからの相対パス**を保持しています。

## 推奨

各PARTをローカルでrepo rootへ展開してからcommitしてください。

投入順:
1. PART00_DOCS_DATA
2. PART01_CURRENT_MOGUZO_PISKE
3. PART02_CURRENT_GODAN_HAKUMA
4. PART03_CURRENT_CHILKA_TAKIMARU
5. PART04_CURRENT_YOMIKAGE_BULLET
6. PART05_DARK_CUTINS_ARCHIVE
7. PART06_LEGACY_MOGUZO_PISKE_GODAN
8. PART07_LEGACY_HAKUMA_CHILKA_TAKIMARU
9. PART08_LEGACY_YOMIKAGE_BULLET

同名パスへ展開すれば1つの納品ツリーになります。

## 注意

- Source PNGは大容量。ゲーム起動時にsource sheet全部をpreloadしない。
- build/importでruntime frameへ変換し、実行時は必要なderived frameを参照する。
- Git LFSを使う場合、GitHub Pages配信方式との整合を先に確認すること。単純にLFS pointerをPagesへ出さない。
- `assets/art/archive/**` はruntime対象外。

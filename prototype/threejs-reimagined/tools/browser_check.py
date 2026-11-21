from playwright.sync_api import sync_playwright
from pathlib import Path
import os
from datetime import datetime, timezone
from PIL import Image
out=Path(__file__).resolve().parents[1]/'evidence'
url='http://127.0.0.1:5173/'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'),args=['--enable-unsafe-swiftshader'])
 for mobile in (False,True):
  ctx=b.new_context(viewport={'width':844 if mobile else 1200,'height':390 if mobile else 800},has_touch=mobile,is_mobile=mobile)
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url);page.wait_for_selector('.tile:nth-child(9)');page.wait_for_function("Array.from(document.images).every(i=>i.complete&&i.naturalWidth)")
  page.clock.install(time=datetime(2025,1,1,tzinfo=timezone.utc));page.clock.pause_at(datetime(2025,1,1,0,0,3,tzinfo=timezone.utc))
  advance=page.clock.run_for
  def tap(key,ms=32):
   page.keyboard.down(key);advance(ms);page.keyboard.up(key);advance(32)
  dev='mobile' if mobile else 'pc'
  page.screenshot(path=out/(dev+'-select.png'))
  ids=['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo']
  comparisons=[]
  for i in ([0] if mobile else range(9)):
   page.locator('.tile').nth(i).click(force=True)
   if not mobile:
    advance(70)
    import io
    from PIL import ImageDraw
    comparison=Image.new('RGB',(270,155),'#e9e1cd')
    original=Image.open(out.parent/'public'/'portraits'/(ids[i]+'.webp')).convert('RGBA');original.thumbnail((124,125))
    comparison.paste(original,(10,127-original.height),original)
     # Capture actual visible pixels against a temporary neutral comparison backdrop.
    page.add_style_tag(content='#sample{background:#e9e1cd;width:128px;height:144px}')
    art=Image.open(io.BytesIO(page.locator('#sample').screenshot())).convert('RGB')
    comparison.paste(art,(138,-7));ImageDraw.Draw(comparison).text((12,136),ids[i].upper(),fill='#222635')
    comparisons.append(comparison)
    page.evaluate("document.head.lastElementChild.tagName==='STYLE'&&document.head.lastElementChild.remove()")
   page.select_option('#opponent',str((i+2)%9));page.locator('#start').click(force=True)
   panel=page.locator('.side').first
   if mobile:
    pad=page.locator('#pad').bounding_box();btn=page.locator('[data-key=special]').bounding_box()
    assert pad['y']+pad['height']<=391
    cdp=ctx.new_cdp_session(page)
    def pt(rect,rx,ry,id):return dict(x=rect['x']+rect['width']*rx,y=rect['y']+rect['height']*ry,id=id)
    def touch(typ,*pts):cdp.send('Input.dispatchTouchEvent',dict(type='touch'+typ,touchPoints=list(pts)))
    back=pt(pad,.06,.5,1);front=pt(pad,.95,.5,1)
    touch('Start',back);advance(48);assert panel.get_attribute('data-guard')=='true';touch('End');advance(32)
    touch('Start',back);advance(32);assert panel.get_attribute('data-motion')=='dash';touch('End');advance(240)
    touch('Start',front);advance(32);touch('End');advance(32);touch('Start',front);advance(32);assert panel.get_attribute('data-motion')=='dash';touch('End');advance(300)
    down=pt(pad,.50,.94,1);attack=pt(btn,.5,.5,2)
    touch('Start',down);advance(32);touch('Start',down,attack);advance(64)
    assert panel.get_attribute('data-motion')=='rise';touch('End');advance(96)
   else:
    if i==0:
     tap('ArrowLeft');page.keyboard.down('ArrowLeft');advance(32);assert panel.get_attribute('data-motion')=='dash';page.keyboard.up('ArrowLeft');advance(200)
     page.keyboard.down('ArrowLeft');advance(48);assert panel.get_attribute('data-guard')=='true';page.keyboard.up('ArrowLeft');advance(50)
    if i==6:
     page.keyboard.down('ArrowLeft');advance(540);page.keyboard.up('ArrowLeft');page.keyboard.down('ArrowRight')
    if i in (1,2,3):page.keyboard.down('ArrowRight');advance(272);page.keyboard.up('ArrowRight')
    if i in (1,4):page.keyboard.down('ArrowDown')
    page.keyboard.down('c');advance(345 if i not in (1,4) else 145);page.keyboard.up('c');page.keyboard.up('ArrowDown');page.keyboard.up('ArrowRight')
   page.screenshot(path=out/(dev+'-'+ids[i]+'.png'))
   if i==0 and not mobile:
    frames=[]
    for k in range(8):
     advance(70);frames.append(Image.open(__import__('io').BytesIO(page.locator('#screen').screenshot())).resize((576,276)))
    frames[0].save(out/'moguzo-motion.gif',save_all=True,append_images=frames[1:],duration=90,loop=0)
   page.locator('#leave').click(force=True)
  if comparisons:
   sheet=Image.new('RGB',(810,465))
   for n,im in enumerate(comparisons):sheet.paste(im,(n%3*270,n//3*155))
   sheet.save(out/'roster-comparison.jpg',quality=92)
   page.locator('#start').click(force=True)
   for _ in range(65):
    advance(1600)
    if page.locator('#result').is_visible():break
   assert page.locator('#result').is_visible()
   page.screenshot(path=out/'pc-result.png')
   page.locator('#again').click(force=True);assert page.locator('#hp0').evaluate("e=>e.style.width")== '100%'
   page.locator('#leave').click(force=True);assert page.locator('#lobby').is_visible()
  assert not errors,errors
  ctx.close()

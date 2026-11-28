// SELECT-A keeps match settings behind the "対戦設定" sheet. Operate them like a player:
// open the sheet when the control is not visible, change it, then close the sheet again.
// Works unchanged on the older always-visible footer (no toggle present).
export async function setMatch(page,selector,value){
 const control=page.locator(selector),toggle=page.locator('#sa-settings-toggle');
 const opened=!(await control.isVisible())&&await toggle.count()>0&&await toggle.isVisible();
 if(opened)await toggle.click();
 if(value===true||value===false)await control.setChecked(value);
 else await control.selectOption(value);
 if(opened&&await page.locator('.sa-settings-close').isVisible())await page.locator('.sa-settings-close').click();
}

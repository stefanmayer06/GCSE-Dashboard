import { test, expect } from '@playwright/test';
import path from 'node:path';
const output=path.resolve('../docs/v2/screenshots');
async function login(page){await page.goto('/maths/');await page.locator('[name=username]').fill('admin');await page.locator('[name=password]').fill('admin');await page.locator('button[type=submit]').click();await expect(page.locator('.studio')).toBeVisible();}
test('studio discovery, settings, focus and responsive rendering',async({page})=>{
  test.setTimeout(90000); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await login(page);
  await page.goto('/maths/search');await page.getByRole('searchbox').fill('fractions');await expect(page.locator('.search-results')).toContainText('Fractions');
  await page.locator('.search-results a').filter({hasText:'Fractions'}).first().click();await expect(page.locator('.lesson-journey')).toBeVisible();
  await page.getByRole('button',{name:'Focus on this session'}).click();await expect(page.locator('.studio-header')).toBeHidden();await page.keyboard.press('Escape');await expect(page.locator('.studio-header')).toBeVisible();
  await page.goto('/maths/settings');await page.getByLabel('Target grade').selectOption('4');await page.getByRole('button',{name:'Save my preferences'}).click();await expect(page.getByRole('status')).toContainText('saved');await page.reload();await expect(page.getByLabel('Target grade')).toHaveValue('4');
  for(const [name,url] of [['home','/maths/'],['map','/maths/learn'],['reflect','/english/reflect'],['lesson','/maths/learn/fractions'],['practice','/english/practice'],['settings','/maths/settings'],['public','/']]){
    for(const width of [1440,390]){await page.setViewportSize({width,height:900});await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);await page.screenshot({path:path.join(output,`${name}-${width}.png`),fullPage:true});}
  }
  await page.setViewportSize({width:1440,height:900});await page.goto('/maths/settings');await page.getByRole('button',{name:'Use dark appearance'}).click();await page.goto('/maths/');await page.screenshot({path:path.join(output,'home-dark.png'),fullPage:true});
  expect(errors).toEqual([]);
});
test('topic filters explain empty results and recover',async({page})=>{await login(page);await page.goto('/english/learn');await page.getByRole('searchbox').fill('no-such-topic');await expect(page.getByText('No topics match this view.')).toBeVisible();await page.getByRole('button',{name:'Show all topics'}).click();await expect(page.locator('.map-topic').first()).toBeVisible();});
test('onboarding reaches goal and diagnostic after exam date',async({page})=>{
 const username=`v2setup${Date.now()}`;
 await page.request.post('/api/auth/signup',{data:{username,password:'v2-test-password'}});
 await page.goto('/maths/');
 await page.locator('.onboarding-card input[type=date]').fill('2027-06-01');
 await page.locator('.onboarding-card').getByRole('button',{name:'Next',exact:true}).click();
 await expect(page.locator('.onboarding-card')).toContainText('What grade');
 await page.getByRole('button',{name:'Grade 4',exact:true}).click();
 await page.locator('.onboarding-card').getByRole('button',{name:'Next',exact:true}).click();
 await expect(page.locator('.onboarding-card').getByRole('link',{name:'Start diagnostic'})).toBeVisible();
});

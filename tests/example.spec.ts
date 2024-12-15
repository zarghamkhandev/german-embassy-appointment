import { test, expect, Page } from "@playwright/test";

test("send summer semester notification", async ({ page }) => {
  await page.goto(
    "https://service2.diplo.de/rktermin/extern/appointment_showForm.do?locationCode=isla&realmId=108&categoryId=1600",
  );

  await expect
    .soft(page.locator("#main #content .wrapper"))
    .toBeAttached({ timeout: 2000 });

  if ((await page.getByRole("textbox").all()).length > 0) {
    await sendSMS(page);
    await sendVoice(page);
    console.log("Appointment found 🎉, notification sent");
  } else {
    console.log("Appointment not found.");
  }
});

const recievers = ["+491783078957", "+923226168996", "+923047818798"];

async function sendSMS(page: Page): Promise<void> {
  const messages = recievers.map((el) => ({
    body: "Appointment for summer semester is now available.",
    to: el,
    from: "+491783078957",
  }));

  const body = {
    messages,
  };
  await request(page, "https://rest.clicksend.com/v3/sms/send", body);
}

async function sendVoice(page: Page): Promise<void> {
  const messages = recievers.map((el) => ({
    source: "php",
    to: el,
    list_id: 1,
    body: "Hey buddy, Appointment for summer semester is now available.",
    lang: "en-us",
    voice: "male",
    schedule: 0,
    require_input: 0,
    machine_detection: 0,
  }));
  const body = {
    messages,
  };
  await request(page, "https://rest.clicksend.com/v3/voice/send", body);
}

async function request(page: Page, url: string, body: any) {
  const auth = "Basic " + btoa(process.env.EMAIL + ":" + process.env.TOKEN);
  return page.evaluate(
    async ({ auth, url, body }) => {
      const headers = new Headers();
      headers.set("Authorization", auth);
      headers.set("Content-Type", "application/json");
      return await fetch(url, {
        body: JSON.stringify(body),
        method: "POST",
        headers,
      }).then((r) => (r.ok ? r.json() : Promise.reject(r)));
    },
    { auth, body, url },
  );
}

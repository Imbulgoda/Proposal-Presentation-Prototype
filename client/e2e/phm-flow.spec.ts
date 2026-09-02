import { expect, test } from "@playwright/test";

test("Doctor can open the demonstration child", async ({ page }) => {
  const login = await page.request.post("http://localhost:8000/auth/login", {
    data: { email: "doctor@gmail.com", password: "Doc123", remember_me: true },
  });
  expect(login.ok()).toBeTruthy();
  const session = await login.json();
  await page.goto(`/auth/hub#csrf=${encodeURIComponent(session.csrf_token)}`);
  await expect(page.getByText("Priority actions")).toBeVisible({ timeout: 15000 });
  await page.getByRole("link", { name: "Children" }).click();
  await page.getByPlaceholder("Search child ID").fill("C-1042");
  await expect(page.getByText("C-1042")).toBeVisible();
});

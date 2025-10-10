import re
from playwright.sync_api import sync_playwright, Page, expect

def verify_chat_caching(page: Page):
    """
    This script verifies the new AI caching functionality by:
    1. Connecting to OBS.
    2. Navigating to the Gemini chat tab.
    3. Sending a message.
    4. Asserting that both a model response and a cache status message appear.
    5. Taking a screenshot of the result.
    """
    # 1. Arrange: Go to the application homepage.
    page.goto("http://localhost:5173/")

    # Expect the main page layout to be visible
    expect(page.locator("div.app-root")).to_be_visible()

    # 2. Act: Connect to OBS
    # Click the settings button/tab to open the connection panel
    settings_tab = page.get_by_role("button", name="Settings")
    expect(settings_tab).to_be_visible()
    settings_tab.click()

    # Fill in connection details
    url_input = page.get_by_label("OBS WebSocket URL")
    password_input = page.get_by_label("OBS WebSocket Password")
    connect_button = page.get_by_role("button", name="Connect")

    expect(url_input).to_be_visible()
    expect(password_input).to_be_visible()

    # Use a mock server address
    url_input.fill("ws://localhost:4455")
    password_input.fill("password")

    expect(connect_button).to_be_enabled()
    connect_button.click()

    # 3. Navigate to Gemini Chat
    gemini_tab = page.get_by_role("button", name="Gemini")
    expect(gemini_tab).to_be_visible()
    gemini_tab.click()

    # 4. Send a chat message
    chat_input = page.get_by_placeholder("Enter your message or command...")
    send_button = page.get_by_role("button", name="Send message")

    expect(chat_input).to_be_visible()
    chat_input.fill("What is the weather like in space?")

    expect(send_button).to_be_enabled()
    send_button.click()

    # 5. Assert: Wait for and verify the model's response and the cache message
    # The model response should appear first
    model_response = page.locator(".message-content").filter(has_text=re.compile(r"space weather", re.IGNORECASE))
    expect(model_response).to_be_visible(timeout=30000)

    # The debug cache message should appear after
    cache_debug_message = page.locator(".message-content").filter(has_text=re.compile(r"\[DEBUG\] Cache hit"))
    expect(cache_debug_message).to_be_visible(timeout=10000)

    # 6. Screenshot: Capture the final state for visual verification.
    page.screenshot(path="jules-scratch/verification/caching_verification.png")
    print("Screenshot captured successfully.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_chat_caching(page)
        finally:
            browser.close()

if __name__ == "__main__":
    main()
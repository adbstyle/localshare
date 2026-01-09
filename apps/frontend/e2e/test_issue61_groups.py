#!/usr/bin/env python3
"""
E2E Tests for Issue #61 - Gemeinschaft verwalten v2

Tests:
- /groups navigation link removed
- /groups URL returns 404
- Community page has groups section
- CreateGroupDialog shows form (not error)
- Group detail page has breadcrumbs
- Breadcrumb navigation works

Requirements:
- pip install playwright
- playwright install chromium

Environment Variables (for authenticated tests):
- TEST_USER_EMAIL: Google OAuth test account email
- TEST_USER_PASSWORD: Google OAuth test account password
- BASE_URL: App URL (default: http://localhost:3000)

Usage:
  # Run without auth (basic tests only)
  python e2e/test_issue61_groups.py

  # Run with auth (full test suite)
  TEST_USER_EMAIL=test@example.com TEST_USER_PASSWORD=secret python e2e/test_issue61_groups.py
"""

from playwright.sync_api import sync_playwright
import sys
import os

# Configuration from environment
BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
TEST_EMAIL = os.environ.get("TEST_USER_EMAIL", "")
TEST_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "")

RESULTS = []


def log_result(test_name: str, passed: bool, details: str = ""):
    status = "\u2705 PASS" if passed else "\u274c FAIL"
    RESULTS.append((test_name, passed, details))
    print(f"{status}: {test_name}")
    if details:
        print(f"   {details}")


def google_login(page):
    """Perform Google OAuth login with Radix UI checkbox support"""
    if not TEST_EMAIL or not TEST_PASSWORD:
        print("\u26a0\ufe0f  No credentials provided, skipping authentication")
        print("   Set TEST_USER_EMAIL and TEST_USER_PASSWORD to enable auth tests")
        return False

    print("\U0001f510 Starting Google OAuth login...")

    page.goto(f"{BASE_URL}/de")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)

    # Radix UI Checkbox: button[role='checkbox'] with data-state attribute
    checkbox = page.locator("#terms")
    if checkbox.count() == 0:
        checkbox = page.locator("button[role='checkbox']")

    if checkbox.count() > 0:
        current_state = checkbox.get_attribute("data-state")
        print(f"   Checkbox initial state: {current_state}")

        if current_state != "checked":
            checkbox.click()
            page.wait_for_timeout(300)
            new_state = checkbox.get_attribute("data-state")
            print(f"   Checkbox after click: {new_state}")

            if new_state != "checked":
                print("\u274c Checkbox could not be activated")
                page.screenshot(path="/tmp/e2e_checkbox_failed.png")
                return False
    else:
        print("\u26a0\ufe0f  Checkbox not found, trying to proceed anyway")

    # Click Google login button
    google_button = page.locator("button:has-text('Google')").first
    if google_button.count() == 0:
        google_button = page.locator("text=Anmelden mit Google").first

    if google_button.count() > 0:
        print("   Clicking Google login button...")
        google_button.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        print(f"   Current URL: {page.url}")

        # Handle Google login page
        if "accounts.google.com" in page.url:
            print("   On Google login page, entering credentials...")

            # Enter email
            email_input = page.locator("input[type='email']")
            if email_input.count() > 0:
                email_input.fill(TEST_EMAIL)
                next_btn = page.locator(
                    "button:has-text('Next'), button:has-text('Weiter'), #identifierNext"
                )
                if next_btn.count() > 0:
                    next_btn.first.click()
                page.wait_for_timeout(3000)

            # Enter password
            password_input = page.locator("input[type='password']")
            if password_input.count() > 0:
                password_input.fill(TEST_PASSWORD)
                next_btn = page.locator(
                    "button:has-text('Next'), button:has-text('Weiter'), #passwordNext"
                )
                if next_btn.count() > 0:
                    next_btn.first.click()
                page.wait_for_timeout(5000)

            page.wait_for_load_state("networkidle")
            print(f"   After login URL: {page.url}")

        # Handle Google OAuth consent page
        if "consent" in page.url or "oauth" in page.url:
            print("   On consent page, clicking Allow...")
            allow_btn = page.locator(
                "button:has-text('Zulassen'), button:has-text('Allow'), button:has-text('Continue')"
            )
            if allow_btn.count() > 0:
                allow_btn.first.click()
                page.wait_for_timeout(3000)
                page.wait_for_load_state("networkidle")
                print(f"   After consent URL: {page.url}")

        # Check if logged in successfully
        if "localhost:3000" in page.url or BASE_URL in page.url:
            page.wait_for_timeout(1000)

            # Check for authenticated UI elements
            auth_indicators = page.locator(
                "[data-testid='user-menu'], button:has-text('Abmelden'), "
                "a:has-text('Gemeinschaften'), header img[alt*='avatar' i]"
            )

            if auth_indicators.count() > 0:
                print("\u2705 Google OAuth Login successful (auth UI found)")
                return True

            # Alternative: Check if we can access protected route
            page.goto(f"{BASE_URL}/de/communities")
            page.wait_for_load_state("networkidle")

            if "/communities" in page.url:
                print("\u2705 Google OAuth Login successful (can access protected route)")
                return True

        page.screenshot(path="/tmp/e2e_auth_failed.png")
        print(f"\u274c Google OAuth Login failed - URL: {page.url}")
        return False

    print("\u274c Google login button not found")
    return False


def test_navigation_removed(page):
    """Test: /groups link not in navigation"""
    page.goto(f"{BASE_URL}/de/communities")
    page.wait_for_load_state("networkidle")

    nav_links = page.locator(
        "header a[href='/groups'], header a[href='/de/groups'], header a[href='/fr/groups']"
    )
    has_direct_groups_link = nav_links.count() > 0

    passed = not has_direct_groups_link
    log_result("Navigation: /groups link removed", passed)


def test_groups_404(page):
    """Test: /groups URL returns 404"""
    response = page.goto(f"{BASE_URL}/de/groups")
    page.wait_for_load_state("networkidle")

    is_404 = response.status == 404 or "404" in page.content()
    log_result("/groups returns 404", is_404, f"Status: {response.status}")


def test_community_page_with_groups(page):
    """Test: Community page has groups section"""
    page.goto(f"{BASE_URL}/de/communities")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/e2e_communities.png")

    # Click on first community card using ID pattern
    community_card = page.locator("[id^='community-']").first
    if community_card.count() > 0:
        community_card.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/e2e_community_detail.png")

        content = page.content()

        has_groups_section = "Gruppen" in content
        log_result("Community page has groups section", has_groups_section)

        create_group_btn = page.locator("text=Gruppe erstellen")
        has_create_btn = create_group_btn.count() > 0
        log_result("'Gruppe erstellen' button present", has_create_btn)

        return True
    else:
        log_result("Community page", False, "No community found")
        return False


def test_create_group_dialog(page):
    """Test: CreateGroupDialog shows form (not error message)"""
    create_btn = page.locator("text=Gruppe erstellen").first
    if create_btn.count() > 0:
        create_btn.click()
        page.wait_for_timeout(500)
        page.screenshot(path="/tmp/e2e_create_dialog.png")

        dialog = page.locator("[role='dialog']")
        dialog_content = dialog.text_content() if dialog.count() > 0 else ""

        shows_error = "keiner Gemeinschaft beigetreten" in dialog_content
        shows_form = (
            "Name" in dialog_content or "name" in dialog_content.lower()
        ) and "Erstellen" in dialog_content

        log_result(
            "CreateGroupDialog shows form",
            shows_form and not shows_error,
            f"Error shown: {shows_error}, Form: {shows_form}",
        )

        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
    else:
        log_result("CreateGroupDialog test", False, "Button not found")


def test_group_detail_with_breadcrumb(page):
    """Test: Group detail page has breadcrumbs"""
    page.goto(f"{BASE_URL}/de/communities")
    page.wait_for_load_state("networkidle")

    community_card = page.locator("[id^='community-']").first
    if community_card.count() > 0:
        community_card.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        # Find and click on a group card
        group_cards = page.locator("[role='button']").all()
        clicked_group = False
        for card in group_cards:
            text = card.text_content() or ""
            if "Mitglied" in text and "Gemeinschaft" not in text:
                card.click()
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(1000)
                clicked_group = True
                break

        if clicked_group:
            page.screenshot(path="/tmp/e2e_group_detail.png")

            breadcrumb = page.locator("nav[aria-label='breadcrumb']")
            has_breadcrumb = breadcrumb.count() > 0

            if has_breadcrumb:
                breadcrumb_text = breadcrumb.text_content()
                has_communities = "Gemeinschaften" in breadcrumb_text

                log_result(
                    "Breadcrumb present", True, f"Text: {breadcrumb_text[:80]}"
                )
                log_result("Breadcrumb contains 'Gemeinschaften'", has_communities)

                # Test breadcrumb navigation
                communities_link = breadcrumb.locator("a:has-text('Gemeinschaften')")
                if communities_link.count() > 0:
                    href = communities_link.get_attribute("href")
                    print(f"   Clicking breadcrumb link: href={href}")
                    communities_link.click()
                    page.wait_for_timeout(1000)
                    page.wait_for_load_state("networkidle")
                    is_correct = (
                        page.url.endswith("/communities")
                        or "/communities?" in page.url
                    )
                    log_result(
                        "Breadcrumb navigation works", is_correct, f"URL: {page.url}"
                    )
            else:
                log_result("Breadcrumb present", False)
        else:
            log_result("Group detail test", False, "No group to click found")


def main():
    print("=" * 60)
    print("E2E Tests for Issue #61 - Gemeinschaft verwalten v2")
    print("=" * 60)
    print(f"BASE_URL: {BASE_URL}")
    print(f"Auth: {'Enabled' if TEST_EMAIL else 'Disabled'}")
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        try:
            # Login if credentials provided
            authenticated = google_login(page)
            if not authenticated:
                print("\u26a0\ufe0f  Running tests without authentication...")
                print()

            # Run tests
            test_navigation_removed(page)
            test_groups_404(page)
            test_community_page_with_groups(page)
            test_create_group_dialog(page)
            test_group_detail_with_breadcrumb(page)

        except Exception as e:
            print(f"\u274c Test Error: {e}")
            import traceback

            traceback.print_exc()
            page.screenshot(path="/tmp/e2e_error.png")
        finally:
            browser.close()

    # Summary
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    passed = sum(1 for _, p, _ in RESULTS if p)
    total = len(RESULTS)
    print(f"Passed: {passed}/{total}")

    if passed == total:
        print("\u2705 ALL TESTS PASSED")
        return 0
    else:
        print("\u274c SOME TESTS FAILED")
        for name, p, details in RESULTS:
            if not p:
                print(f"   - {name}: {details}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

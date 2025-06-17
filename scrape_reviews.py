import time
import psycopg2
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from urllib.parse import urlparse
from datetime import datetime
import re

def slug_to_name(slug):
    return ' '.join(word.capitalize() for word in slug.split('-'))

conn = psycopg2.connect(
    dbname="hotels_info_db",
    user="postgres",
    password="database123",
    host="localhost",
    port="5432"
)
cursor = conn.cursor()

chrome_options = Options()
chrome_options.headless = False
chrome_options.add_argument("--disable-blink-features=AutomationControlled")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("user-agent=Mozilla/5.0")
driver = webdriver.Chrome(options=chrome_options)

with open("hotels.txt", "r", encoding="utf-8") as f:
    hotel_urls = [line.strip() for line in f if line.strip()]

for url in hotel_urls:
    try:
        print(f"\nScraping {url}")
        driver.get(url)
        time.sleep(5)
        for _ in range(5):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1)

        soup = BeautifulSoup(driver.page_source, 'html.parser')

        slug = urlparse(url).path.split('/')[1]
        hotel_name = slug_to_name(slug)

        cursor.execute('SELECT * FROM "Hotels" WHERE "GlobalPropertyName" ILIKE %s', (f"%{hotel_name}%",))
        hotel = cursor.fetchone()
        if not hotel:
            print(f"[!] hotel not found in db: {hotel_name}")
            continue

        hotel_id = hotel[0]
        cursor.execute('DELETE FROM "Reviews" WHERE "HotelID" = %s', (hotel_id,))
        print(f"[i] existing reviews cleared for: {hotel_name}")

        def extract_rating(label):
            label_el = soup.find("span", string=re.compile(label, re.IGNORECASE))
            if label_el:
                parent_li = label_el.find_parent("li")
                if parent_li:
                    number_match = re.search(r"(\d+\.\d+)", parent_li.text)
                    if number_match:
                        return float(number_match.group(1))
            return None

        cleanliness = extract_rating("Cleanliness")
        location = extract_rating("Location")
        service = extract_rating("Service")
        value = extract_rating("Value")

        review_cards = soup.select('div.Review-comment-bubble')
        print(f"[i] found {len(review_cards)} review cards")

        for card in review_cards:
            #put the right selectors for Agoda(booking site)
            title_el = card.select_one('h4[data-testid="review-title"]')
            content_el = card.select_one('p[data-testid="review-comment"]')
            review_title = title_el.text.strip() if title_el else "No Title"
            review_content = content_el.text.strip() if content_el else None
            if not review_content:
                continue

            rating_el = card.find_previous("div", class_="Review-comment-leftScore")
            try:
                rating = float(rating_el.text.strip()) if rating_el else 0.0
            except:
                rating = 0.0

            try:
                reviewer_name = card.find_parent("div", class_="Review-comment") \
                    .select_one("div.Review-comment-reviewer strong").text.strip()
            except:
                reviewer_name = "guest"

            date_text = card.find(string=re.compile(r"Reviewed\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}"))
            review_date = datetime.today().date()
            if date_text:
                match = re.search(r"Reviewed\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})", date_text)
                if match:
                    try:
                        review_date = datetime.strptime(match.group(1), "%B %d, %Y").date()
                    except:
                        pass
            #INSERT into db
            cursor.execute("""
                INSERT INTO "Reviews" (
                    "HotelID", "ReviewerName", "ReviewSubject", "ReviewContent",
                    "ReviewDate", "OverallRating", "CleanlinessRating",
                    "LocationRating", "ServiceRating", "ValueRating",
                    "createdAt", "updatedAt"
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                hotel_id,
                reviewer_name,
                review_title,
                review_content,
                review_date,
                rating,
                cleanliness,
                location,
                service,
                value,
                datetime.now(),
                datetime.now()
            ))

        conn.commit()
        print(f"[done] reviews saved for hotel: {hotel_name}")

    except Exception as e:
        print(f"[x] error scraping {url}: {e}")
        conn.rollback()

driver.quit()
cursor.close()
conn.close()
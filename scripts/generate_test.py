#!/usr/bin/env python3
"""
Test Your Mind — Automated Test Generator
GitHub Actions workflow에서 호출: python scripts/generate_test.py "주제"
Claude API를 사용하여 주제에 맞는 심리테스트 데이터를 생성하고 tests.js에 추가합니다.
"""

import sys
import json
import os
import re
import anthropic

def slug(text):
    """주제를 URL-safe slug으로 변환"""
    s = text.lower().strip()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'\s+', '-', s)
    return s[:50]

def build_prompt(topic: str) -> str:
    return f"""You are a professional psychology test writer. Create a complete, science-informed personality test based on this topic: "{topic}"

Return ONLY valid JavaScript object literal (no markdown, no code fences, no extra text) with EXACTLY this structure:

{{
  "id": "<slug-id>",
  "slug": "<slug-id>",
  "title": "<engaging test title>",
  "category": "<one of: Personality | Love & Relationships | Mental Health | Career | Stress & Burnout | Fun & Light>",
  "categoryColor": "<one of: purple | rose | teal | blue | gold>",
  "emoji": "<single emoji>",
  "participants": "<number like 89,234>",
  "duration": "<X min>",
  "resultTypes": <number 3-5>,
  "intro": "<300+ word engaging introduction to this test topic, with real psychological grounding. Use double newlines for paragraphs.>",
  "background": "<150+ word psychological background explaining the theory behind this test>",
  "howToUse": "<100+ word practical guidance on how to interpret and apply results>",
  "questions": [
    {{
      "text": "<question text>",
      "options": [
        {{"label": "A", "text": "<option text>", "score": {{"<result_key>": <points>}}}},
        {{"label": "B", "text": "<option text>", "score": {{"<result_key>": <points>}}}},
        {{"label": "C", "text": "<option text>", "score": {{"<result_key>": <points>}}}},
        {{"label": "D", "text": "<option text>", "score": {{"<result_key>": <points>}}}}
      ]
    }}
  ],
  "results": {{
    "<result_key>": {{
      "type": "<short type name>",
      "emoji": "<emoji>",
      "title": "<result title>",
      "traits": ["<trait1>", "<trait2>", "<trait3>", "<trait4>"],
      "description": "<300+ word rich description of this result type. Real insights, not platitudes.>",
      "dailyLife": "<150+ word description of how this shows up day-to-day>",
      "advice": "<150+ word practical, compassionate advice for this type>"
    }}
  }}
}}

Requirements:
- Exactly 10 questions
- Each question has exactly 4 options (A, B, C, D)
- Create exactly {3 if "fun" in topic.lower() else 4} result types with meaningful keys (e.g., "secure", "anxious", "avoidant", "disorganized")
- Each result type result key must appear as score key in options
- Questions must be psychologically insightful, not trivial
- All text must be in English
- The intro must be 300+ words
- Keep JSON strictly valid (escape quotes in strings with backslash)

Topic: {topic}"""

def generate_test(topic: str) -> dict:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    
    print(f"🧠 Generating test for topic: '{topic}'")
    
    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=8192,
        messages=[
            {"role": "user", "content": build_prompt(topic)}
        ]
    )
    
    raw = message.content[0].text.strip()
    
    # Remove any markdown code fences if present
    raw = re.sub(r'^```(?:json|javascript)?\n?', '', raw)
    raw = re.sub(r'\n?```$', '', raw)
    raw = raw.strip()
    
    test_data = json.loads(raw)
    
    # Override slug/id based on topic
    test_slug = slug(topic)
    test_data["id"] = test_slug
    test_data["slug"] = test_slug
    
    # Ensure questions field has length info
    print(f"✅ Generated: '{test_data['title']}' with {len(test_data['questions'])} questions and {len(test_data['results'])} result types")
    
    return test_data

def update_tests_js(new_test: dict):
    """js/data/tests.js 파일에 새 테스트를 추가합니다"""
    tests_path = os.path.join(os.path.dirname(__file__), '..', 'js', 'data', 'tests.js')
    tests_path = os.path.normpath(tests_path)
    
    with open(tests_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if test with same slug already exists
    test_slug = new_test['slug']
    if f"slug: '{test_slug}'" in content or f'slug: "{test_slug}"' in content:
        print(f"⚠️  Test with slug '{test_slug}' already exists. Updating...")
        # Remove existing entry with this slug - find the object and remove it
        # Simple approach: regenerate the array
    
    # Convert test data to JS object string
    test_js = json.dumps(new_test, ensure_ascii=False, indent=2)
    
    # Find the TESTS_DATA array and insert new test at the beginning
    # Pattern: const TESTS_DATA = [
    insert_marker = 'const TESTS_DATA = ['
    if insert_marker in content:
        pos = content.find(insert_marker) + len(insert_marker)
        # Insert after the opening bracket
        new_content = content[:pos] + '\n  ' + test_js + ',' + content[pos:]
    else:
        print("❌ Could not find TESTS_DATA array in tests.js")
        sys.exit(1)
    
    with open(tests_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ Updated {tests_path}")
    print(f"📌 New test '{new_test['title']}' added at the top of TESTS_DATA")

def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_test.py <topic>")
        sys.exit(1)
    
    topic = ' '.join(sys.argv[1:])
    
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY environment variable is not set")
        sys.exit(1)
    
    test_data = generate_test(topic)
    update_tests_js(test_data)
    
    print(f"\n🎉 Done! Test '{test_data['title']}' is ready.")
    print(f"🔗 Slug: {test_data['slug']}")

if __name__ == "__main__":
    main()

import sys
import os
import time

# Add backend directory to path so we can import main
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from main import NLPPipeline

nlp = NLPPipeline()

def create_dummy_pdf(filename, text, pages=1):
    from reportlab.pdfgen import canvas
    c = canvas.Canvas(filename)
    for p in range(pages):
        textobject = c.beginText()
        textobject.setTextOrigin(10, 800)
        for line in text.split('\n'):
            textobject.textLine(line[:100])
        c.drawText(textobject)
        c.showPage()
    c.save()
    return filename

# ===================================================================
# ORIGINAL 10 SCENARIOS (must still pass)
# ===================================================================

print("=" * 60)
print("ORIGINAL PIPELINE TESTS (Scenarios 1-10)")
print("=" * 60)

print("\n--- Scenario 1: Empty/Garbage Resume ---")
pdf1 = create_dummy_pdf("empty.pdf", "   \n\n\n  !@#$%^&*()_+ \n\n")
try:
    text1 = nlp.extract_text_from_pdf(pdf1)
    skills1 = nlp.extract_skills(text1)
    print(f"Extracted Text: {repr(text1)}")
    print(f"Skills Extracted: {skills1}")
    print("Pass: Handled without crashing")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 2: Non-English Resume ---")
text2 = "अनुभव: मैंने पायथन और जावा में काम किया है। \n Compétences: développement web, gestion de projet, et un peu de javascript."
try:
    skills2 = nlp.extract_skills(text2)
    print(f"Skills Extracted: {skills2}")
    if "javascript" in skills2:
        print("Pass: Extracted english skills embedded in non-english text, didn't crash.")
    else:
        print("Behavior: Didn't extract non-english skills (expected since dictionary is English).")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 3: Skill Inflation ---")
text3 = "Skills: " + "Python " * 50
try:
    skills3 = nlp.extract_skills(text3)
    strength3 = nlp.calculate_skill_strength(text3, skills3)
    print(f"Skills Extracted: {skills3}")
    print(f"Skill Strength: {strength3}")
    if strength3.get("python", 0) <= 100:
        print("Pass: Score is capped realistically.")
    else:
        print("Fail: Score inflated too much.")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 4: Missing Sections ---")
text4 = "John Doe\nSoftware Engineer\nPython, Java, C++\nWorked at Google for 5 years."
try:
    sections4 = nlp.extract_sections(text4)
    print("Sections:")
    for k, v in sections4.items():
        if v.strip(): print(f"  {k}: {repr(v.strip())}")
    print("Pass: Gracefully put everything in header or other available sections.")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 5: Irrelevant Job Match ---")
resume_text5 = "Data Scientist with 5 years experience in machine learning, Python, pandas, numpy, and deep learning."
job_text5 = "Looking for an experienced Executive Chef. Must know how to cook French cuisine, manage a kitchen, and create menus."
try:
    match5 = nlp.match_resume_to_job(resume_text5, job_text5, ["python", "machine learning"], ["cooking", "management"])
    print(f"Match Score: {match5['similarity_score']} (Text Sim: {match5['text_similarity']})")
    print("Check: Ensure score is near zero.")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 6: Overlapping Skills ---")
text6 = "Skills: ReactJS, Node.js"
job_skills6 = ["react", "nodejs"]
try:
    skills6 = nlp.extract_skills(text6)
    match6 = nlp.match_resume_to_job(text6, "Need React and Nodejs", skills6, job_skills6)
    print(f"Extracted Skills: {skills6}")
    print(f"Matched Skills: {match6['matched_skills']}")
    print("Check: Did it match ReactJS to React?")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 7: Fake Skills ---")
text7 = "Skills: Python, QuantumScript, HyperAI, Java"
try:
    skills7 = nlp.extract_skills(text7)
    print(f"Extracted Skills: {skills7}")
    print("Check: Ensure QuantumScript and HyperAI are missing.")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 8: Single Word Resume ---")
pdf8 = create_dummy_pdf("single.pdf", "Python")
try:
    text8 = nlp.extract_text_from_pdf(pdf8)
    skills8 = nlp.extract_skills(text8)
    strength8 = nlp.calculate_skill_strength(text8, skills8)
    print(f"Extracted Text: {repr(text8)}")
    print(f"Skills Extracted: {skills8}")
    print(f"Strength: {strength8}")
    print("Pass: Handled single word without crashing.")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 9: Very Long Resume ---")
long_text = ("Experience with Python, Java, C++.\n" * 50)
pdf9 = create_dummy_pdf("long.pdf", long_text, pages=20)
try:
    start_time = time.time()
    text9 = nlp.extract_text_from_pdf(pdf9)
    skills9 = nlp.extract_skills(text9)
    end_time = time.time()
    print(f"Extracted length: {len(text9)} characters")
    print(f"Time taken: {end_time - start_time:.2f} seconds")
    print("Pass: Processed long resume.")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 10: Duplicate Job Postings ---")
resume_text10 = "Python Developer with Django experience."
resume_skills10 = ["python", "django"]
job_text_10a = "Looking for a Python developer with Django."
job_text_10b = "Looking for a Python developer with Django."
job_skills10 = ["python", "django"]
try:
    match10a = nlp.match_resume_to_job(resume_text10, job_text_10a, resume_skills10, job_skills10)
    match10b = nlp.match_resume_to_job(resume_text10, job_text_10b, resume_skills10, job_skills10)
    print(f"Score A: {match10a['similarity_score']}, Score B: {match10b['similarity_score']}")
    if match10a['similarity_score'] == match10b['similarity_score']:
         print("Pass: Consistent scoring for identical jobs.")
    else:
         print("Fail: Inconsistent scoring.")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

# Cleanup
os.remove("empty.pdf")
os.remove("single.pdf")
os.remove("long.pdf")

# ===================================================================
# NEW SEMANTIC MATCHING TESTS (Scenarios 11-16)
# ===================================================================

print("\n" + "=" * 60)
print("SEMANTIC SKILL MATCHING TESTS (Scenarios 11-16)")
print("=" * 60)

print("\n--- Scenario 11: MySQL resume vs SQL job ---")
try:
    match11 = nlp.match_resume_to_job(
        "Database Administrator with 5 years experience in MySQL and data modeling.",
        "Looking for a Database Administrator skilled in SQL and data management.",
        ["mysql"], ["sql"]
    )
    print(f"Match Score: {match11['similarity_score']}%")
    print(f"Match Details: {match11.get('match_details', [])}")
    if match11['similarity_score'] >= 50:
        print("Pass: MySQL correctly matched to SQL semantically.")
    else:
        print(f"Fail: Score too low ({match11['similarity_score']}%).")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 12: PostgreSQL resume vs SQL job ---")
try:
    match12 = nlp.match_resume_to_job(
        "Backend developer experienced in PostgreSQL databases.",
        "Looking for a developer with SQL expertise.",
        ["postgresql"], ["sql"]
    )
    print(f"Match Score: {match12['similarity_score']}%")
    print(f"Match Details: {match12.get('match_details', [])}")
    if match12['similarity_score'] >= 50:
        print("Pass: PostgreSQL correctly matched to SQL semantically.")
    else:
        print(f"Fail: Score too low ({match12['similarity_score']}%).")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 13: TensorFlow resume vs Deep Learning job ---")
try:
    match13 = nlp.match_resume_to_job(
        "ML Engineer with TensorFlow and neural network development.",
        "Looking for a Deep Learning engineer to build neural networks.",
        ["tensorflow"], ["deep learning"]
    )
    print(f"Match Score: {match13['similarity_score']}%")
    print(f"Match Details: {match13.get('match_details', [])}")
    if match13['similarity_score'] >= 50:
        print("Pass: TensorFlow correctly matched to Deep Learning semantically.")
    else:
        print(f"Fail: Score too low ({match13['similarity_score']}%).")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 14: Pandas resume vs Data Analysis job ---")
try:
    match14 = nlp.match_resume_to_job(
        "Data Analyst proficient in Pandas and data visualization.",
        "Need a Data Analyst skilled in Data Analysis and reporting.",
        ["pandas"], ["data analysis"]
    )
    print(f"Match Score: {match14['similarity_score']}%")
    print(f"Match Details: {match14.get('match_details', [])}")
    if match14['similarity_score'] >= 50:
        print("Pass: Pandas correctly matched to Data Analysis semantically.")
    else:
        print(f"Fail: Score too low ({match14['similarity_score']}%).")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 15: Data Scientist resume vs Chef job (should stay low) ---")
try:
    match15 = nlp.match_resume_to_job(
        "Data Scientist with Python, pandas, machine learning, and deep learning experience.",
        "Executive Chef needed. Must manage a kitchen and cook French cuisine.",
        ["python", "pandas", "machine learning", "deep learning"], ["cooking", "management"]
    )
    print(f"Match Score: {match15['similarity_score']}%")
    if match15['similarity_score'] < 15:
        print("Pass: Irrelevant match correctly penalized.")
    else:
        print(f"Warning: Score higher than expected ({match15['similarity_score']}%).")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n--- Scenario 16: find_semantic_skill_matches() direct test ---")
try:
    mysql_matches = nlp.find_semantic_skill_matches("mysql")
    print(f"Semantic matches for 'mysql':")
    for m in sorted(mysql_matches, key=lambda x: x['similarity'], reverse=True)[:5]:
        print(f"  {m['skill']}: {m['similarity']}")
    
    tf_matches = nlp.find_semantic_skill_matches("tensorflow")
    print(f"Semantic matches for 'tensorflow':")
    for m in sorted(tf_matches, key=lambda x: x['similarity'], reverse=True)[:5]:
        print(f"  {m['skill']}: {m['similarity']}")
    print("Pass: Semantic matcher returned results without crashing.")
except Exception as e:
    print(f"Fail: Crashed with error: {e}")

print("\n" + "=" * 60)
print("ALL TESTS COMPLETE")
print("=" * 60)

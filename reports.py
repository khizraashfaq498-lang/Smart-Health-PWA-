import json

# Load data
with open("data.json", "r") as file:
    data = json.load(file)

vitals = data["vitals"]
medicines = data["medicines"]
steps_today = int(data["stepsToday"])
step_goal = int(data["stepGoal"])

# Process vitals
total_entries = len(vitals)
avg_hr = 0
if total_entries > 0:
    avg_hr = sum(v["hr"] for v in vitals) // total_entries

# Generate report
report = f"""
SMART HEALTH PWA – REPORT SUMMARY

Total Vitals Entries: {total_entries}
Average Heart Rate: {avg_hr} bpm

Total Medications Scheduled: {len(medicines)}

Steps Today: {steps_today}
Daily Goal: {step_goal}

Status:
"""

if steps_today >= step_goal:
    report += "✔ Step goal achieved\n"
else:
    report += "✘ Step goal not achieved\n"

# Save output
with open("output_report.txt", "w") as out:
    out.write(report)

print("Report generated successfully!")


# Understanding Percentages and Rates
## School Longitudinal Inspection System

---

## Dashboard Statistics (Top Cards)

### 1. Average Performance (e.g., 67.36%)

**What It Is:**
The average grade of all students across all selected years.

**How It's Calculated:**
```
Step 1: Add up all students' yearly averages
        Student 1: 75% + Student 2: 68% + Student 3: 52% + ... = Total

Step 2: Divide by number of students
        Total ÷ Number of Students = Average Performance

Example:
        (75 + 68 + 52 + 80 + 45) ÷ 5 = 320 ÷ 5 = 64%
```

**Real Example from Your Data:**
- 2015: 377 students, average = 75.31%
- 2016: 409 students, average = 74.37%
- 2017: 351 students, average = 52.41%
- **All Years Combined: 67.36%**

**What It Means:**
- **Above 70%**: Good - Most students performing well
- **60-70%**: Moderate - Room for improvement (Your current status)
- **50-60%**: Below average - Significant intervention needed
- **Below 50%**: Critical - Majority failing

**Why It Matters:**
This single number tells you if the school is doing well overall. A declining average (like yours: 75% → 74% → 52%) signals serious problems.

---

### 2. Pass Rate (e.g., 88.30%)

**What It Is:**
The percentage of students who have an overall average of 50% or higher.

**How It's Calculated:**
```
Step 1: Count students with average ≥ 50%
        Students passing: 1,003

Step 2: Divide by total students and multiply by 100
        (1,003 ÷ 1,137) × 100 = 88.30%
```

**Real Example from Your Data:**
- 2015: 365 out of 377 passed = 96.82% pass rate ✅
- 2016: 402 out of 409 passed = 98.29% pass rate ✅
- 2017: 245 out of 351 passed = 69.8% pass rate ⚠️
- **All Years Average: 88.30%**

**What It Means:**
- **Above 95%**: Excellent - Almost all students passing
- **85-95%**: Good - Most students passing (Your current status)
- **70-85%**: Concerning - Too many students failing
- **Below 70%**: Critical - Majority at risk (Like 2017!)

**Why It Matters:**
This shows what percentage of students are meeting minimum standards. Your 2017 pass rate of 69.8% means 30.2% of students are failing!

**Difference from Average Performance:**
- **Average Performance**: How well students are doing (0-100%)
- **Pass Rate**: How many students are passing (percentage of students)

Example:
- School A: 75% average, 95% pass rate (Most students doing well)
- School B: 55% average, 70% pass rate (Many students struggling)

---

### 3. Red Flags Count (e.g., 199)

**What It Is:**
Number of students who have ANY subject below 50% OR overall average below 50%.

**How It's Calculated:**
```
For each student:
  Check if ANY subject < 50%
  OR
  Check if overall average < 50%
  
  If YES → Add to red flags count
```

**Real Example from Your Data:**
- 2015: 62 students flagged
- 2016: 72 students flagged
- 2017: 65 students flagged
- **Total: 199 students at risk**

**What It Means:**
This is NOT a percentage - it's a count of actual students who need help.

**As a Percentage:**
```
199 red flags ÷ 1,137 total students = 17.5% of students at risk
```

**Why It Matters:**
These are students who need immediate intervention. Each one represents a real student who might fail.

---

## Performance Trends Chart

### Year-by-Year Percentages

**What You See:**
```
2015: 75.31%
2016: 74.37%
2017: 52.41%
```

**What Each Means:**
- **2015: 75.31%** - In 2015, the average student scored 75.31%
- **2016: 74.37%** - In 2016, the average student scored 74.37%
- **2017: 52.41%** - In 2017, the average student scored 52.41%

**The Trend:**
```
75.31% → 74.37% → 52.41%
  ↓         ↓         ↓
 -0.94%   -21.96%  (MAJOR DROP!)
```

**What This Tells You:**
- 2015-2016: Slight decline (-0.94%) - Normal variation
- 2016-2017: Massive decline (-21.96%) - CRISIS!
- Overall: -22.9% decline over 3 years

**Why This Happened:**
Something changed dramatically in 2017:
- New curriculum?
- Teacher changes?
- Student demographics?
- External factors?

---

## Subject Averages

### Individual Subject Percentages

**Example Display:**
```
Maths: 58.5%
English: 72.3%
Physics: 45.2%
```

**What Each Means:**
- **Maths: 58.5%** - Average grade in Math across all students
- **English: 72.3%** - Average grade in English
- **Physics: 45.2%** - Average grade in Physics (CRITICAL!)

**How to Interpret:**
- **Above 70%**: Subject is being taught well
- **60-70%**: Subject needs some attention
- **50-60%**: Subject needs significant improvement
- **Below 50%**: Subject in crisis (Like Physics at 45.2%)

**Why It Matters:**
Identifies which subjects need more resources, better teachers, or curriculum changes.

---

## Red Flags Table

### Student-Specific Percentages

**Example Row:**
```
Student ID: STU-2015-9A-006
Overall Average: 48.91%
Failing Subjects: 8
- English: 41.00%
- Maths: 46.50%
- Physics: 41.50%
```

**What Each Means:**
- **Overall Average: 48.91%** - This student's average across all subjects
- **English: 41.00%** - Student scored 41% in English (FAILING)
- **Maths: 46.50%** - Student scored 46.5% in Math (FAILING)

**Why They're Flagged:**
Any subject below 50% = Red flag. This student has 8 subjects below 50%!

---

## Infrastructure Impact Scores

### Facility Impact Percentages

**Example Display:**
```
Library: +5%
Science Labs: -12%
Computer Lab: -10%
```

**What Each Means:**
- **+5%**: Positive impact - Good facilities helping performance
- **-12%**: Negative impact - Poor facilities hurting performance
- **-10%**: Negative impact - Needs improvement

**How It's Calculated:**
Based on correlation between facility quality and student performance:
- If performance is low AND facility is poor → Negative impact
- If performance is good AND facility is good → Positive impact

**What It Means:**
- **Positive (+)**: Keep investing in this facility
- **Negative (-)**: Urgent improvement needed
- **Neutral (0)**: Adequate but could be better

---

## 2018 Predictions

### Predicted Performance (e.g., 44.46%)

**What It Is:**
Statistical forecast of what 2018 average performance will be if current trends continue.

**How It's Calculated:**
```
Step 1: Plot historical data
        2015: 75.31%
        2016: 74.37%
        2017: 52.41%

Step 2: Draw trend line through points
        Trend: Declining at -11.45% per year

Step 3: Extend line to 2018
        2017: 52.41% - 11.45% = 40.96%
        (Adjusted with statistical methods = 44.46%)
```

**Confidence Range: 34% - 54%**
- **Best case**: 54% (if things improve)
- **Most likely**: 44.46%
- **Worst case**: 34% (if decline continues)

**What It Means:**
- **44.46%**: Below passing threshold (50%)
- **Trend**: Declining
- **Reliability**: Medium (based on 3 years of data)

**Why It Matters:**
This is a WARNING! If nothing changes, 2018 will be even worse than 2017.

---

## Subject Predictions

### Individual Subject Forecasts

**Example Display:**
```
Maths: 42.5% (📉 Declining, -8.2%)
English: 68.3% (📈 Improving, +3.1%)
Physics: 38.9% (📉 Declining, -12.5%)
```

**What Each Means:**
- **Maths: 42.5%** - Predicted 2018 Math average
- **📉 Declining** - Trend direction
- **-8.2%** - Expected change from 2017

**How to Read:**
- **📈 Improving**: Subject getting better
- **📉 Declining**: Subject getting worse
- **➡️ Stable**: No significant change

---

## Comparison Examples

### Understanding the Differences

**Scenario 1: Good School**
```
Total Students: 400
Average Performance: 78%
Pass Rate: 96%
Red Flags: 16 (4%)
```
**Interpretation:** Excellent performance, very few struggling students.

---

**Scenario 2: Your School (All Years)**
```
Total Students: 1,137
Average Performance: 67.36%
Pass Rate: 88.30%
Red Flags: 199 (17.5%)
```
**Interpretation:** Moderate overall, but concerning number of at-risk students.

---

**Scenario 3: Your School (2017 Only)**
```
Total Students: 351
Average Performance: 52.41%
Pass Rate: 69.8%
Red Flags: 65 (18.5%)
```
**Interpretation:** CRITICAL! Majority of students struggling.

---

## Key Takeaways

### What Each Percentage Tells You

| Percentage | What It Measures | Your Value | Status |
|------------|------------------|------------|--------|
| **Average Performance** | How well students score | 67.36% | Moderate |
| **Pass Rate** | How many students pass | 88.30% | Good |
| **Red Flag %** | How many need help | 17.5% | Concerning |
| **2018 Prediction** | Future performance | 44.46% | CRITICAL |

### The Story Your Data Tells

1. **2015-2016**: School was doing well (75-74% average, 96-98% pass rate)
2. **2017**: Something went wrong (52% average, 70% pass rate)
3. **2018 Forecast**: Will get worse (44% predicted) if no action taken
4. **At-Risk Students**: 199 students need immediate help
5. **Weakest Subjects**: Physics, Math, Science (all below 50%)
6. **Infrastructure**: Science labs and computer lab need urgent upgrades

### Action Required

Based on these percentages:
- ⚠️ **IMMEDIATE**: Intervention for 199 red-flagged students
- ⚠️ **URGENT**: Improve Science and Math teaching
- ⚠️ **HIGH PRIORITY**: Upgrade science labs and computer equipment
- ⚠️ **CRITICAL**: Prevent predicted 2018 decline

---

**Remember:** These aren't just numbers - each percentage represents real students who need support!

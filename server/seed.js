const bcrypt = require('bcryptjs');
const { evaluateLeadScore } = require('./services/aiService');

function seedDatabase(db) {
  console.log('🌱 Seeding NIAT Connect database with comprehensive realistic demo data...');

  const passwordHashAdmin = bcrypt.hashSync('Admin@123', 10);
  const passwordHashStudent = bcrypt.hashSync('Student@123', 10);

  // 1. Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password, role, status, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('Dr. Arvind Swaminathan', 'admin@niat.edu.in', '+91 98765 43210', passwordHashAdmin, 'ADMIN', 'ACTIVE', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  insertUser.run('Rahul Sharma', 'rahul.sharma@gmail.com', '+91 98111 22334', passwordHashStudent, 'STUDENT', 'ACTIVE', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150');
  insertUser.run('Priya Patel', 'priya.patel@gmail.com', '+91 98222 33445', passwordHashStudent, 'STUDENT', 'ACTIVE', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');
  insertUser.run('Ananya Verma', 'ananya.verma@gmail.com', '+91 98333 44556', passwordHashStudent, 'STUDENT', 'ACTIVE', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150');

  // 2. Insert Student Profiles
  const insertProfile = db.prepare(`
    INSERT INTO student_profiles (
      user_id, current_education, class_12_passing_year, class_12_percentage,
      city, state, interested_program, dream_career, application_stage,
      counselling_preferred_time, parent_name, parent_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProfile.run(
    2, 'Class 12 (CBSE Science PCM)', 2026, 92.4,
    'Hyderabad', 'Telangana', 'B.Tech CSE (AI & ML)', 'AI Research Engineer', 'COUNSELLING_COMPLETED',
    'Weekday Evenings (5 PM - 7 PM)', 'Suresh Sharma', '+91 98111 22000'
  );

  insertProfile.run(
    3, 'Class 12 (State Board PCM)', 2026, 88.6,
    'Bengaluru', 'Karnataka', 'B.Tech Data Science & Analytics', 'Chief Data Scientist', 'APPLICATION_STARTED',
    'Weekend Mornings (10 AM - 12 PM)', 'Ramesh Patel', '+91 98222 33000'
  );

  insertProfile.run(
    4, 'Class 12 (ICSE Science PCM)', 2025, 94.8,
    'Pune', 'Maharashtra', 'B.Tech Software Engineering', 'Cloud Architect', 'INQUIRY',
    'Anytime on Saturday', 'Mahesh Verma', '+91 98333 44000'
  );

  // 3. Insert Counsellors
  const insertCounsellor = db.prepare(`
    INSERT INTO counsellors (name, email, phone, specialization, active_leads_count, rating, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertCounsellor.run('Dr. Rajesh Rao', 'rajesh.rao@niat.edu.in', '+91 99001 12233', 'AI & Machine Learning Admissions', 18, 4.9, 'AVAILABLE');
  insertCounsellor.run('Priya Nair', 'priya.nair@niat.edu.in', '+91 99002 23344', 'Data Science & High School Outreach', 22, 4.8, 'AVAILABLE');
  insertCounsellor.run('Amit Deshmukh', 'amit.deshmukh@niat.edu.in', '+91 99003 34455', 'Software Engineering & Scholarships', 15, 4.7, 'AVAILABLE');
  insertCounsellor.run('Sunita Reddy', 'sunita.reddy@niat.edu.in', '+91 99004 45566', 'Parent Counselling & Career Guidance', 20, 4.9, 'AVAILABLE');
  insertCounsellor.run('Vikrant Mehta', 'vikrant.mehta@niat.edu.in', '+91 99005 56677', 'Lateral Entry & Academic Eligibility', 12, 4.6, 'AVAILABLE');
  insertCounsellor.run('Neha Gupta', 'neha.gupta@niat.edu.in', '+91 99006 67788', 'Entrance Exam Guidance & Interview Prep', 16, 4.8, 'AVAILABLE');

  // 4. Insert Verified Knowledge Base Documents (for RAG AI Assistant)
  const insertKB = db.prepare(`
    INSERT INTO knowledge_base_documents (title, category, content, tags, source_reference)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertKB.run(
    'About NIAT - NextGen Institute of Advanced Technology',
    'General',
    `NextGen Institute of Advanced Technology (NIAT) is India's premier autonomous higher education institute dedicated exclusively to futuristic computer science, Artificial Intelligence, and exponential software engineering.
Founded with the mission to bridge the gap between traditional academic theory and hyper-scale technology companies, NIAT offers immersive, industry-co-designed undergraduate engineering degree programs.
Our curriculum is vetted by distinguished tech leaders from Silicon Valley and India, featuring 100% project-driven pedagogy, world-class GPU clusters, state-of-the-art innovation incubators, and full-semester corporate fellowships.`,
    'about, vision, institute, ranking, history, overview',
    'NIAT Admissions Handbook 2026, Section 1.1'
  );

  insertKB.run(
    'B.Tech in Computer Science & Engineering (AI & Machine Learning)',
    'Programs',
    `Degree: 4-Year Full-Time Bachelor of Technology (B.Tech)
Approved by AICTE and affiliated with leading technical universities.
Specialization Highlights:
- Deep Learning & Neural Architectures
- Large Language Models (LLMs) & Generative AI Systems
- Computer Vision & Edge AI Deployment
- Reinforcement Learning & Autonomous Agents
- Capstone Project supervised by industry mentors.
Graduates are prepared for roles including AI Engineer, Machine Learning Scientist, Research Fellow, and MLOps Architect.`,
    'btech, ai, ml, artificial intelligence, machine learning, curriculum, syllabus',
    'NIAT Academic Bulletin 2026-27, Page 14'
  );

  insertKB.run(
    'B.Tech in Computer Science (Data Science & Analytics)',
    'Programs',
    `Degree: 4-Year Full-Time Bachelor of Technology (B.Tech)
Focuses on massive-scale data infrastructure, statistical learning, real-time analytics, and data-driven product architecture.
Core Modules:
- Distributed Computing with Spark, Trino, and Kafka
- Predictive Analytics and Bayesian Inference
- Big Data Lakehouses and Cloud Data Engineering
- Natural Language Analytics & Visual Storytelling
Careers: Big Data Engineer, Quantitative Analyst, Data Scientist, BI Architect.`,
    'btech, data science, analytics, big data, statistics, curriculum',
    'NIAT Academic Bulletin 2026-27, Page 22'
  );

  insertKB.run(
    'B.Tech in Software Engineering & Distributed Systems',
    'Programs',
    `Degree: 4-Year Full-Time Bachelor of Technology (B.Tech)
Tailored for building ultra-resilient, planet-scale software architectures.
Key Domains:
- High-Performance Distributed Systems & Microservices
- Cloud-Native Infrastructure, Kubernetes & Site Reliability Engineering (SRE)
- Applied Cryptography and Web3 Protocols
- Modern Full-Stack Web and Mobile Engineering (Next.js, TypeScript, Go, Rust)
Careers: Full-Stack Engineer, Systems Architect, Infrastructure Engineer, SRE.`,
    'btech, software engineering, systems, backend, full stack, distributed systems',
    'NIAT Academic Bulletin 2026-27, Page 28'
  );

  insertKB.run(
    '2026 Admission Eligibility Criteria & Academic Requirements',
    'Eligibility',
    `To be eligible for admission into the 4-Year B.Tech program for the 2026-27 Academic Batch:
1. Academic Qualification: Successful completion of Class 12 (10+2) or equivalent from a recognized board (CBSE, ICSE, State Boards, IB, or Cambridge).
2. Mandatory Subjects: Physics and Mathematics as compulsory subjects, along with Chemistry, Computer Science, Biology, or Electronics.
3. Minimum Aggregate: At least 60% aggregate marks in PCM/PM+Computer Science (55% for reserved/merit categories).
4. Passing Year: Candidates passing Class 12 in 2026, 2025, or 2024 are eligible. Gap-year candidates are welcome subject to verification.
5. Lateral Entry: 3-Year Polytechnic Diploma holders in Computer Science/IT/ECE with 65%+ can apply for direct 2nd-year entry.`,
    'eligibility, requirements, 12th marks, pcm, criteria, cut-off, age, diploma',
    'NIAT Admissions Handbook 2026, Section 2.1'
  );

  insertKB.run(
    'Application Procedure & Important Admission Dates (2026 Intake)',
    'Admissions',
    `The NIAT Admission Process consists of 5 streamlined stages:
Stage 1 - Online Application: Register on niat.edu.in, fill academic profile, and pay application fee (Rs 1,000, waived for early bird applicants).
Stage 2 - NSAT (NIAT Scholastic Aptitude Test): Computer-based test evaluating logical reasoning, quantitative analysis, and coding aptitude. (Exemption granted for JEE Main percentile > 85% or high score in national olympiads).
Stage 3 - Technical & Motivational Counselling: 30-minute one-on-one session with NIAT faculty and student advisors.
Stage 4 - Document Verification: Digital verification of Class 10/12 marks cards, identity proof, and certificates.
Stage 5 - Provisional Seat Offer & Enrollment: Acceptance of offer letter and initial seat confirmation deposit.

Key Dates for 2026 Intake:
- Phase 1 Application Deadline: April 30, 2026
- NSAT Cycle 1 Examination: May 10 - 15, 2026
- Counselling Sessions: Rolling weekly through June 2026
- Academic Orientation & Classes Begin: August 10, 2026.`,
    'process, application, procedure, deadline, dates, how to apply, steps',
    'NIAT Admissions Handbook 2026, Section 3.2'
  );

  insertKB.run(
    'NSAT (NIAT Scholastic Aptitude Test) Pattern & Syllabus',
    'Admissions',
    `NSAT is an adaptive 90-minute online entrance assessment designed to measure foundational thinking rather than rote memory:
Section 1: Quantitative Problem Solving (30 Questions, 30 Mins) - Algebra, Probability, Calculus basics, Discrete Mathematics.
Section 2: Logical & Algorithmic Reasoning (25 Questions, 30 Mins) - Pattern recognition, computational logic, data interpretation.
Section 3: Computational Thinking & Comprehension (20 Questions, 30 Mins) - Pseudocode tracing, reasoning over technical passages.
Negative Marking: None.
Practice mocks and sample papers are accessible in the student dashboard after registration.`,
    'nsat, exam, entrance test, syllabus, sample paper, test pattern',
    'NIAT Examination Portal Guidelines 2026'
  );

  insertKB.run(
    'Tuition Fee Structure, Installments & Education Loans',
    'Fees_Scholarships',
    `Official Fee Structure for 2026-27 Academic Year:
- Tuition Fee: Rs 1,45,000 per semester (Rs 2,90,000 per academic year).
- Laboratory, GPU Cluster & Cloud Credits Fee: Rs 15,000 per semester.
- One-Time Admission & Library Caution Deposit: Rs 20,000 (Refundable upon graduation).
- Hostel & Mess (Optional): Standard Triple/Twin Air-conditioned rooms range from Rs 1,10,000 to Rs 1,40,000 per year including all meals.

Payment Schedules:
- Flexible 0% interest EMI options available through partnering financial institutions (HDFC Credila, SBI Scholar, Axis Bank).
- Fees can be paid in 2 equal semester installments or through 10-month automated monthly plans.`,
    'fees, tuition, cost, hostel fees, installments, payment, loans',
    'NIAT Finance Office Schedule 2026'
  );

  insertKB.run(
    'Scholarships & Financial Aid Programs (Up to 100% Tuition Waiver)',
    'Fees_Scholarships',
    `NIAT believes no deserving engineer should be held back by financial constraints. We offer four premier scholarship programs:
1. NextGen Apex Merit Scholarship:
   - Top 5% in NSAT or JEE Main > 97%ile: 100% Tuition Fee Waiver for all 4 years.
   - JEE Main 92-97%ile: 50% Tuition Fee Waiver.
2. Women in Technology Excellence Award:
   - 25% to 50% fee scholarship for high-performing female engineering aspirants.
3. Young Innovator & Builder Fellowship:
   - For students with demonstrated open-source contributions, patent filings, or exceptional GitHub repositories.
4. Need-Cum-Merit Assistance:
   - For family annual income < Rs 5,00,000 with strong academic credentials.
Applications for scholarships open automatically during the online counselling stage.`,
    'scholarships, financial aid, waiver, free, discount, merit, girl students',
    'NIAT Scholarship Foundation Guidelines 2026'
  );

  insertKB.run(
    'Campus Facilities, High-Performance Labs & Student Life',
    'Campus_Facilities',
    `NIAT Campus is located in the vibrant technology corridor with modern smart infrastructure:
- AI & Supercomputing Lab: NVIDIA H100 and A100 GPU clusters available 24x7 for student research.
- 24x7 Innovation Incubator: Dedicated maker space with 3D printers, IoT hardware kits, and collaboration pods.
- High-Speed Connectivity: 10 Gbps redundant fiber internet campus-wide.
- Residential Facilities: Separate modern hostels for male and female students with biometric security, air conditioning, gymnasium, and high-nutrition cafeteria catering to diverse regional cuisines.
- Sports & Wellness: Indoor badminton courts, football turf, basketball court, and mental wellness counselling centre.`,
    'campus, labs, facilities, hostel, accommodation, wifi, mess, food, sports',
    'NIAT Student Life & Campus Guide 2026'
  );

  insertKB.run(
    'Career Placements, Internships & Corporate Partners',
    'Placements',
    `NIAT has an outstanding track record of high-impact industry placements:
- Highest International Package: INR 52.4 LPA (Leading US Tech Firm)
- Highest Domestic Package: INR 44.0 LPA (Tier-1 AI Platform)
- Average Package (Overall B.Tech): INR 14.8 LPA
- Median Package (AI/Data Science): INR 16.2 LPA
- Mandatory 6-Month Paid Corporate Internship in Semester 7/8.
Top Recruiting Partners: Google, Microsoft, Amazon, NextWave, Atlassian, Adobe, Goldman Sachs, Uber, Swiggy, and high-growth Silicon Valley and Bengaluru AI unicorns.`,
    'placement, salary, ctc, average package, companies, jobs, recruiters, internships',
    'NIAT Placement Directorate Report 2025'
  );

  insertKB.run(
    'Parent Admission FAQs - Safety, Mentorship & Return on Investment',
    'FAQs',
    `Common Questions from Parents:
Q: How safe is the NIAT campus and hostel?
A: NIAT maintains round-the-clock professional security, gated biometric access, CCTV monitoring, and dedicated resident faculty wardens. A 24/7 medical infirmary with on-call ambulance is stationed on campus.

Q: Will my child receive personal mentoring?
A: Every NIAT student is assigned an Academic Mentor (Faculty) and an Industry Mentor (Senior Engineer) from Day 1 who monitor academic progress and career development.

Q: How can parents stay updated with their child\'s progress?
A: Parents receive term-end reports, access to the Parent Portal, and can schedule counselling meetings with the Dean of Student Affairs at any time.`,
    'parent, safety, hostel security, mentoring, warden, guardian, roi',
    'NIAT Parent Information Brochure 2026'
  );

  // 5. Insert Events
  const insertEvent = db.prepare(`
    INSERT INTO events (
      title, category, description, event_date, start_time, end_time,
      location_type, venue_or_link, speaker_name, speaker_title, capacity, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEvent.run(
    'NIAT National Admission Webinar 2026',
    'NIAT Admission Webinar',
    'Join our Dean of Academic Affairs and Director of Admissions for a comprehensive deep-dive into the 2026 B.Tech admissions, NSAT entrance exam roadmap, and 100% scholarship opportunities. Live Q&A included.',
    '2026-12-05', '11:00 AM', '12:30 PM',
    'Online', 'https://meet.google.com/nia-admi-web',
    'Dr. Arvind Swaminathan', 'Director of Admissions', 500, 'PUBLISHED'
  );

  insertEvent.run(
    'Generative AI & LLMs Hands-on Masterclass',
    'Technology Workshop',
    'Experience what it feels like to build real-world AI applications at NIAT. Learn how to fine-tune open-source models, construct RAG pipelines, and deploy edge intelligence in this interactive hands-on workshop.',
    '2026-12-12', '02:00 PM', '04:30 PM',
    'Campus', 'NIAT AI Center of Excellence, Lab 4, Tech Campus',
    'Siddharth Ramanathan', 'Head of AI Research', 120, 'PUBLISHED'
  );

  insertEvent.run(
    'Parent Counselling & Career ROI Session',
    'Parent Counselling Session',
    'Dedicated interactive webinar designed for parents. Discuss engineering education ROI, placement trajectories, campus safety, hostels, and financial aid options with our leadership and current student parents.',
    '2026-12-18', '06:00 PM', '07:30 PM',
    'Online', 'https://zoom.us/j/98765432101',
    'Sunita Reddy', 'Dean of Student Affairs', 300, 'PUBLISHED'
  );

  insertEvent.run(
    'Campus Open House & High-Tech Lab Tour',
    'Campus Orientation',
    'Visit our sprawling modern campus in person! Tour the NVIDIA Supercomputing Lab, Robotic Automation Floor, Maker Studios, and meet currently enrolled student innovators over high-tea.',
    '2026-12-22', '10:00 AM', '01:00 PM',
    'Campus', 'NIAT Main Academic Block, Reception Hub',
    'Dr. Rajesh Rao', 'Lead Faculty & Advisor', 150, 'PUBLISHED'
  );

  insertEvent.run(
    'B.Tech Curriculum & Tech Industry Alignment Panel',
    'Admission Guidance Session',
    'Why traditional computer science syllabi are outdated and how NIAT modernizes systems, cloud, and distributed architectures to prepare students for tier-1 tech careers.',
    '2026-12-28', '04:00 PM', '05:30 PM',
    'Online', 'https://meet.google.com/nia-tech-curr',
    'Amit Deshmukh', 'Associate Dean of Curriculum', 250, 'PUBLISHED'
  );

  insertEvent.run(
    'NextGen Innovators Hack-Day & Tech Interaction',
    'Student Interaction Session',
    'Meet current NIAT tech scholars, explore award-winning capstone projects, ask raw unvarnished questions about campus culture, hostel food, hackathons, and startup incubation.',
    '2027-01-08', '03:00 PM', '05:00 PM',
    'Campus', 'Innovation Incubator Auditorium',
    'Student Council Leads', 'NIAT Developers Guild', 180, 'PUBLISHED'
  );

  // 6. Insert Event Registrations for Demo Students
  const insertReg = db.prepare(`
    INSERT INTO event_registrations (event_id, student_id, ticket_number, attended)
    VALUES (?, ?, ?, ?)
  `);

  insertReg.run(1, 2, 'NIAT-EVT-1001', 0);
  insertReg.run(2, 2, 'NIAT-EVT-1002', 0);
  insertReg.run(1, 3, 'NIAT-EVT-1003', 0);
  insertReg.run(3, 3, 'NIAT-EVT-1004', 0);

  // 7. Insert Realistic Admission Leads (25+ Leads with full AI scoring)
  const leadsData = [
    {
      student_name: 'Aditya Kulkarni',
      email: 'aditya.kulkarni@gmail.com',
      phone: '+91 98201 44556',
      current_education: '12th Passed (Science PCM)',
      class_12_passing_year: 2026,
      city: 'Mumbai',
      state: 'Maharashtra',
      interested_program: 'B.Tech CSE (AI & ML)',
      lead_source: 'Webinar',
      admission_interest_level: 'High',
      counselling_status: 'Counselling Scheduled',
      assigned_counsellor_id: 1,
      follow_up_date: '2026-11-20',
      notes: 'Attended full webinar; asked detailed questions on GPU cluster and LLM curriculum.'
    },
    {
      student_name: 'Sneha Venkatesh',
      email: 'sneha.v@yahoo.com',
      phone: '+91 98402 33441',
      current_education: '12th Pursuing (CBSE)',
      class_12_passing_year: 2026,
      city: 'Chennai',
      state: 'Tamil Nadu',
      interested_program: 'B.Tech Data Science & Analytics',
      lead_source: 'Education Fair',
      admission_interest_level: 'High',
      counselling_status: 'Contacted',
      assigned_counsellor_id: 2,
      follow_up_date: '2026-11-21',
      notes: 'Met at Chennai Education Conclave. Father is senior IT director; very keen on data infrastructure.'
    },
    {
      student_name: 'Rohan Mehra',
      email: 'rohan.mehra@gmail.com',
      phone: '+91 98115 67890',
      current_education: '12th Pursuing (ICSE)',
      class_12_passing_year: 2026,
      city: 'Delhi',
      state: 'Delhi NCR',
      interested_program: 'B.Tech Software Engineering',
      lead_source: 'Website',
      admission_interest_level: 'High',
      counselling_status: 'Counselling Completed',
      assigned_counsellor_id: 3,
      follow_up_date: '2026-11-22',
      notes: 'Has strong portfolio of Next.js projects on GitHub. Recommended for Young Innovator Scholarship.'
    },
    {
      student_name: 'Tanvi Joshi',
      email: 'tanvi.joshi@outlook.com',
      phone: '+91 97660 12345',
      current_education: '12th Pursuing (State Board)',
      class_12_passing_year: 2026,
      city: 'Pune',
      state: 'Maharashtra',
      interested_program: 'B.Tech CSE (AI & ML)',
      lead_source: 'Referral',
      admission_interest_level: 'High',
      counselling_status: 'Documents Pending',
      assigned_counsellor_id: 1,
      follow_up_date: '2026-11-23',
      notes: 'Referred by alumni cousin. Uploaded 10th and 11th marks cards; awaiting 12th pre-board results.'
    },
    {
      student_name: 'Karthik Raja',
      email: 'karthik.raja@gmail.com',
      phone: '+91 94441 55667',
      current_education: '12th Passed (State Board)',
      class_12_passing_year: 2025,
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      interested_program: 'B.Tech Software Engineering',
      lead_source: 'Campus Visit',
      admission_interest_level: 'High',
      counselling_status: 'Admitted',
      assigned_counsellor_id: 4,
      follow_up_date: null,
      notes: 'Visited campus with parents. Seat confirmation deposit paid for Fall 2026 batch.'
    },
    {
      student_name: 'Manish Chawla',
      email: 'manish.c@gmail.com',
      phone: '+91 98103 99887',
      current_education: '12th Pursuing (CBSE)',
      class_12_passing_year: 2026,
      city: 'Gurugram',
      state: 'Haryana',
      interested_program: 'B.Tech CSE (AI & ML)',
      lead_source: 'Social Media',
      admission_interest_level: 'Medium',
      counselling_status: 'Contacted',
      assigned_counsellor_id: 5,
      follow_up_date: '2026-11-24',
      notes: 'Saw Instagram ad; interested in game development and AI simulation.'
    },
    {
      student_name: 'Ishita Banerjee',
      email: 'ishita.b@gmail.com',
      phone: '+91 98301 22334',
      current_education: '12th Pursuing (WB Board)',
      class_12_passing_year: 2026,
      city: 'Kolkata',
      state: 'West Bengal',
      interested_program: 'B.Tech Data Science & Analytics',
      lead_source: 'Webinar',
      admission_interest_level: 'Medium',
      counselling_status: 'New',
      assigned_counsellor_id: 2,
      follow_up_date: '2026-11-25',
      notes: 'Registered via national education portal. Requested fee brochure and scholarship details.'
    },
    {
      student_name: 'Nikhil Gowda',
      email: 'nikhil.gowda@gmail.com',
      phone: '+91 98450 77889',
      current_education: '12th Pursuing (Karnataka PU)',
      class_12_passing_year: 2026,
      city: 'Bengaluru',
      state: 'Karnataka',
      interested_program: 'B.Tech Software Engineering',
      lead_source: 'Education Fair',
      admission_interest_level: 'Medium',
      counselling_status: 'Counselling Scheduled',
      assigned_counsellor_id: 3,
      follow_up_date: '2026-11-20',
      notes: 'Looking for work-integrated engineering or co-op options in Bengaluru.'
    },
    {
      student_name: 'Meera Nambiar',
      email: 'meera.nambiar@gmail.com',
      phone: '+91 94470 11223',
      current_education: '12th Pursuing (Kerala HSE)',
      class_12_passing_year: 2026,
      city: 'Kochi',
      state: 'Kerala',
      interested_program: 'B.Tech CSE (AI & ML)',
      lead_source: 'Website',
      admission_interest_level: 'Medium',
      counselling_status: 'Contacted',
      assigned_counsellor_id: 6,
      follow_up_date: '2026-11-26',
      notes: 'Excellent mathematics foundation. Inquiring about girls hostel safety and medical facilities.'
    },
    {
      student_name: 'Varun Saxena',
      email: 'varun.saxena@gmail.com',
      phone: '+91 98290 88776',
      current_education: '12th Passed (CBSE)',
      class_12_passing_year: 2025,
      city: 'Jaipur',
      state: 'Rajasthan',
      interested_program: 'B.Tech Data Science & Analytics',
      lead_source: 'Direct Outreach',
      admission_interest_level: 'Medium',
      counselling_status: 'New',
      assigned_counsellor_id: 2,
      follow_up_date: '2026-11-27',
      notes: 'Preparing for entrance exams. Exploring modern private engineering alternatives to NITs.'
    },
    {
      student_name: 'Gaurav Bhatia',
      email: 'gaurav.b@gmail.com',
      phone: '+91 98188 55443',
      current_education: '12th Pursuing (CBSE)',
      class_12_passing_year: 2027,
      city: 'Noida',
      state: 'Uttar Pradesh',
      interested_program: 'B.Tech CSE (AI & ML)',
      lead_source: 'Social Media',
      admission_interest_level: 'Low',
      counselling_status: 'New',
      assigned_counsellor_id: 5,
      follow_up_date: '2026-12-01',
      notes: 'Class 11 student doing early exploration. Sent newsletter subscription.'
    },
    {
      student_name: 'Pooja Hegde',
      email: 'pooja.hegde@hotmail.com',
      phone: '+91 98860 33221',
      current_education: '12th Pursuing (Karnataka PU)',
      class_12_passing_year: 2027,
      city: 'Mangaluru',
      state: 'Karnataka',
      interested_program: 'B.Tech Software Engineering',
      lead_source: 'Website',
      admission_interest_level: 'Low',
      counselling_status: 'Contacted',
      assigned_counsellor_id: 3,
      follow_up_date: '2026-12-05',
      notes: 'Early inquiry. Primary target is 2027 intake.'
    },
    {
      student_name: 'Akash Tripathi',
      email: 'akash.tripathi@gmail.com',
      phone: '+91 94150 99881',
      current_education: '12th Passed (State Board)',
      class_12_passing_year: 2023,
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      interested_program: 'B.Tech CSE (AI & ML)',
      lead_source: 'Social Media',
      admission_interest_level: 'Low',
      counselling_status: 'Dropped',
      assigned_counsellor_id: 6,
      follow_up_date: null,
      notes: 'Gap period exceeds 3 years without technical experience. Unresponsive on phone follow-up.'
    },
    {
      student_name: 'Harish Sundaram',
      email: 'harish.s@yahoo.com',
      phone: '+91 98410 44332',
      current_education: 'Commerce with Mathematics',
      class_12_passing_year: 2026,
      city: 'Madurai',
      state: 'Tamil Nadu',
      interested_program: 'B.Tech Data Science & Analytics',
      lead_source: 'Website',
      admission_interest_level: 'Medium',
      counselling_status: 'Contacted',
      assigned_counsellor_id: 2,
      follow_up_date: '2026-11-20',
      notes: 'Student does not have Physics in 10+2. Informed of statutory AICTE eligibility mandate.'
    },
    {
      student_name: 'Divya Rastogi',
      email: 'divya.rastogi@gmail.com',
      phone: '+91 98100 11229',
      current_education: '10th Passed (High School)',
      class_12_passing_year: 2028,
      city: 'Agra',
      state: 'Uttar Pradesh',
      interested_program: 'B.Tech CSE (AI & ML)',
      lead_source: 'Social Media',
      admission_interest_level: 'Low',
      counselling_status: 'New',
      assigned_counsellor_id: 1,
      follow_up_date: null,
      notes: 'Grade 10 student. Encouraged to take Science PCM in senior secondary.'
    },
    {
      student_name: 'Sameer Sheikh',
      email: 'sameer.sheikh@gmail.com',
      phone: '+91 98900 66554',
      current_education: 'Diploma in Computer Tech',
      class_12_passing_year: 2026,
      city: 'Nagpur',
      state: 'Maharashtra',
      interested_program: 'B.Tech Software Engineering',
      lead_source: 'Education Fair',
      admission_interest_level: 'High',
      counselling_status: 'Counselling Scheduled',
      assigned_counsellor_id: 5,
      follow_up_date: '2026-11-21',
      notes: 'Applying for Lateral Entry (Direct 2nd Year). 84% in polytechnic diploma.'
    },
    {
      student_name: 'Kavita Pillai',
      email: 'kavita.pillai@gmail.com',
      phone: '+91 94460 88771',
      current_education: '12th Pursuing (CBSE)',
      class_12_passing_year: 2026,
      city: 'Thiruvananthapuram',
      state: 'Kerala',
      interested_program: 'B.Tech CSE (AI & ML)',
      lead_source: 'Campus Visit',
      admission_interest_level: 'High',
      counselling_status: 'Counselling Completed',
      assigned_counsellor_id: 1,
      follow_up_date: '2026-11-22',
      notes: 'Father attended live session. Inquiring about Women in Tech scholarship documentation.'
    },
    {
      student_name: 'Tushar Singhal',
      email: 'tushar.s@gmail.com',
      phone: '+91 98260 55441',
      current_education: '12th Pursuing (MP Board)',
      class_12_passing_year: 2026,
      city: 'Indore',
      state: 'Madhya Pradesh',
      interested_program: 'B.Tech Data Science & Analytics',
      lead_source: 'Referral',
      admission_interest_level: 'High',
      counselling_status: 'Contacted',
      assigned_counsellor_id: 4,
      follow_up_date: '2026-11-23',
      notes: 'Friend enrolled in last year batch. Highly motivated to start AI and cloud certifications.'
    },
    {
      student_name: 'Deepak Varma',
      email: 'deepak.varma@gmail.com',
      phone: '+91 98490 22119',
      current_education: '12th Pursuing (Telangana Inter)',
      class_12_passing_year: 2026,
      city: 'Hyderabad',
      state: 'Telangana',
      interested_program: 'B.Tech Software Engineering',
      lead_source: 'Direct Outreach',
      admission_interest_level: 'High',
      counselling_status: 'Documents Pending',
      assigned_counsellor_id: 3,
      follow_up_date: '2026-11-24',
      notes: 'Local Hyderabad student. Requested campus visit slot for Saturday.'
    },
    {
      student_name: 'Shreya Mittal',
      email: 'shreya.mittal@gmail.com',
      phone: '+91 98110 33448',
      current_education: '12th Pursuing (CBSE)',
      class_12_passing_year: 2026,
      city: 'Chandigarh',
      state: 'Punjab',
      interested_program: 'B.Tech CSE (AI & ML)',
      lead_source: 'Webinar',
      admission_interest_level: 'High',
      counselling_status: 'Admitted',
      assigned_counsellor_id: 1,
      follow_up_date: null,
      notes: 'Top scorer in NSAT Mock 1. Full admission confirmation issued.'
    }
  ];

  const insertLead = db.prepare(`
    INSERT INTO leads (
      student_name, email, phone, current_education, class_12_passing_year,
      city, state, interested_program, lead_source, admission_interest_level,
      counselling_status, assigned_counsellor_id, follow_up_date, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertScore = db.prepare(`
    INSERT INTO lead_scores (
      lead_id, score, ai_classification, is_manually_overridden,
      override_reason, breakdown_json
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertActivity = db.prepare(`
    INSERT INTO lead_activities (lead_id, activity_type, description, performed_by)
    VALUES (?, ?, ?, ?)
  `);

  const insertFollowUp = db.prepare(`
    INSERT INTO follow_ups (
      lead_id, counsellor_id, scheduled_date, scheduled_time,
      contact_method, status, outcome_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  leadsData.forEach((lead, index) => {
    const leadRes = insertLead.run(
      lead.student_name, lead.email, lead.phone, lead.current_education, lead.class_12_passing_year,
      lead.city, lead.state, lead.interested_program, lead.lead_source, lead.admission_interest_level,
      lead.counselling_status, lead.assigned_counsellor_id, lead.follow_up_date, lead.notes
    );
    const leadId = leadRes.lastInsertRowid || (index + 1);

    // Run AI Lead Evaluation
    const aiResult = evaluateLeadScore(lead);
    insertScore.run(
      leadId,
      aiResult.score,
      aiResult.ai_classification,
      0,
      null,
      JSON.stringify(aiResult.breakdown)
    );

    // Initial activity log
    insertActivity.run(
      leadId,
      'STATUS_CHANGE',
      `Lead initialized with status "${lead.counselling_status}" via ${lead.lead_source}. Classified as ${aiResult.ai_classification} (Score: ${aiResult.score}).`,
      'NIAT AI System'
    );

    // Follow-up if date present
    if (lead.follow_up_date) {
      insertFollowUp.run(
        leadId,
        lead.assigned_counsellor_id,
        lead.follow_up_date,
        '03:00 PM',
        lead.counselling_status === 'Counselling Scheduled' ? 'Video Call' : 'Phone',
        'PENDING',
        lead.notes
      );
    }
  });

  // 8. Insert Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, target_role, title, message, type, link, is_read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Admin notifications
  insertNotif.run(
    1, 'ADMIN',
    '3 New Hot Leads Identified',
    'AI Lead Qualification Engine segmented 3 new prospective students ready for immediate counselling.',
    'ALERT',
    '/admin/leads?classification=Hot',
    0
  );

  insertNotif.run(
    1, 'ADMIN',
    'Upcoming Follow-up Calls (Today)',
    'You have 4 scheduled counselling follow-ups due today. Check the CRM Follow-up queue.',
    'REMINDER',
    '/admin/follow-ups',
    0
  );

  insertNotif.run(
    1, 'ADMIN',
    'National Webinar Registrations Reached 500',
    'NIAT National Admission Webinar 2026 has crossed 500 registered prospective students.',
    'EVENT',
    '/admin/events',
    1
  );

  // Student notifications
  insertNotif.run(
    2, 'STUDENT',
    'Welcome to NIAT Connect!',
    'Your prospective student profile has been verified. You can now explore verified curriculum guides, connect with counsellors, or ask our AI assistant.',
    'INFO',
    '/student/dashboard',
    0
  );

  insertNotif.run(
    2, 'STUDENT',
    'Admission Webinar Confirmation',
    'You are registered for "NIAT National Admission Webinar 2026" on Dec 5, 2026 at 11:00 AM.',
    'EVENT',
    '/student/calendar',
    0
  );

  insertNotif.run(
    2, 'STUDENT',
    'NSAT Mock Test 1 is Now Live',
    'Test your quantitative and algorithmic reasoning before the official NSAT cycle. Access syllabus in the handbook.',
    'ADMISSION',
    '/student/faq',
    0
  );

  console.log('✅ NIAT Connect database successfully seeded with all realistic records.');
}

function seedNiat2Expansion(db) {
  console.log('🚀 Checking and seeding NIAT Connect 2.0 expansion records...');

  // 1. Referral Settings
  db.prepare(`
    INSERT OR IGNORE INTO referral_settings (key, value) VALUES ('points_per_referral', '25')
  `).run();

  // 2. Student Referral Codes
  const insertCode = db.prepare('INSERT OR IGNORE INTO referral_codes (user_id, code) VALUES (?, ?)');
  insertCode.run(2, 'NIAT-RAHUL-7821');
  insertCode.run(3, 'NIAT-PRIYA-3419');
  insertCode.run(4, 'NIAT-ANANYA-9012');

  // 3. Demo Referrals for Rahul Sharma (user_id = 2)
  const existingRefs = db.prepare('SELECT COUNT(*) as count FROM student_referrals').get().count;
  if (existingRefs === 0) {
    const insertRef = db.prepare(`
      INSERT INTO student_referrals (
        referrer_id, referred_name, referred_email, referred_phone, referral_code, status, points_awarded, notes, verified_by, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    insertRef.run(
      2, 'Karan Mehta', 'karan.m@gmail.com', '+91 98444 55667', 'NIAT-RAHUL-7821', 'APPROVED', 25,
      'Class 12 CBSE PCM 94.2%. Interested in B.Tech AI & ML. Verified and admitted.', 1
    );

    insertRef.run(
      2, 'Sneha Reddy', 'sneha.r@gmail.com', '+91 98555 66778', 'NIAT-RAHUL-7821', 'APPROVED', 25,
      'Class 12 State Board 91.0%. Completed admission guidance session.', 1
    );

    insertRef.run(
      2, 'Aditya Joshi', 'aditya.j@gmail.com', '+91 98666 77889', 'NIAT-RAHUL-7821', 'PENDING', 0,
      'Registered via referral link. In counselling queue.', null
    );

    // Initial Ledger entries for Rahul Sharma
    const insertTx = db.prepare(`
      INSERT INTO reward_transactions (student_id, transaction_type, points, description, reference_id, status)
      VALUES (?, ?, ?, ?, ?, 'COMPLETED')
    `);

    insertTx.run(2, 'Referral Reward', 25, 'Referral reward for student: Karan Mehta', 'REF-1');
    insertTx.run(2, 'Referral Reward', 25, 'Referral reward for student: Sneha Reddy', 'REF-2');
  }

  // 4. Initial Swag Merchandise Products
  const existingProducts = db.prepare('SELECT COUNT(*) as count FROM swag_products').get().count;
  if (existingProducts === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO swag_products (name, description, category, points_required, stock, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
    `);

    insertProduct.run(
      'NIAT Signature Developer T-Shirt',
      'Premium 100% bio-washed cotton, embroidered NIAT emblem & NextGen tech crest. Breathable and comfortable for long coding sessions.',
      'Apparel',
      10,
      45,
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600'
    );

    insertProduct.run(
      'NIAT Minimalist Tech Cap',
      'Ergonomic breathable cotton cap with embroidered NIAT insignia and adjustable moisture-wicking strap.',
      'Accessories',
      5,
      30,
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600'
    );

    insertProduct.run(
      'NIAT Hacker Backpack',
      'Weather-resistant ballistic nylon, padded 15.6" laptop compartment, ergonomic lumbar support, and integrated USB charging passthrough.',
      'Bags',
      20,
      15,
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'
    );

    insertProduct.run(
      'NIAT Hydro Thermal Flask',
      'Double-wall vacuum insulated 750ml food-grade 304 stainless steel bottle. Keeps drinks cold for 24 hours or hot for 12 hours.',
      'Accessories',
      8,
      25,
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600'
    );

    insertProduct.run(
      'NIAT Cyber Black Dev Hoodie',
      'Heavyweight 380 GSM fleece hoodie with embroidered algorithm syntax on sleeve and metallic embossed chest crest.',
      'Apparel',
      25,
      20,
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600'
    );
  }

  // 5. Initial AI Facts
  const existingFacts = db.prepare('SELECT COUNT(*) as count FROM ai_facts').get().count;
  if (existingFacts === 0) {
    const insertFact = db.prepare(`
      INSERT INTO ai_facts (title, explanation, interesting_example, category, fact_date, source_link, source_title, image_url, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertFact.run(
      'Mixture of Experts (MoE) Architecture in Frontier LLMs',
      'Rather than activating every parameter on every token, Mixture of Experts routes inputs dynamically to specialized sub-networks ("experts"), slashing inference compute by up to 60% while maintaining frontier benchmark scores.',
      'Models like Mixtral 8x7B use 8 distinct neural expert networks per layer, but each token only engages 2 experts at any millisecond during generation.',
      'Generative AI',
      new Date().toISOString().split('T')[0],
      'https://arxiv.org/abs/1701.06538',
      'ArXiv Deep Learning Research (Shazeer et al.)',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600'
    );

    insertFact.run(
      'Sim-to-Real Transfer with Domain Randomization',
      'Roboticists train neural policies across thousands of simulated parallel physics engines with randomized gravity, friction, and visual textures so that physical hardware works immediately upon zero-shot real-world deployment.',
      'OpenAI famously taught a humanoid robot hand to solve a Rubik\'s cube entirely within simulated virtual physics before ever touching a real cube.',
      'Robotics',
      '2026-11-19',
      'https://arxiv.org/abs/1910.07113',
      'IEEE International Conference on Robotics and Automation (ICRA)',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600'
    );

    insertFact.run(
      'Autonomous Deep-Space Navigation Using Optical AI',
      'Deep-space probes operating millions of kilometers beyond Earth use onboard edge vision algorithms to identify celestial constellations in real time without waiting for round-trip radio signals from ground control.',
      'NASA\'s James Webb Space Telescope uses fine guidance sensors and autonomous star identification to maintain pointing stability with sub-milliarcsecond precision.',
      'Space Technology',
      '2026-11-18',
      'https://www.jpl.nasa.gov',
      'NASA Jet Propulsion Laboratory (JPL) Autonomous Systems',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600'
    );

    insertFact.run(
      'Post-Quantum Cryptography: Lattice-Based Key Exchange',
      'With Shor\'s quantum algorithm capable of breaking traditional RSA and ECC encryption, global standards bodies (NIST) have standardized lattice-based cryptography that resists both classical and quantum supercomputing attacks.',
      'CRYSTALS-Kyber and Dilithium are already being implemented across modern web browsers and TLS layers to guard against "harvest now, decrypt later" threats.',
      'Cybersecurity',
      '2026-11-17',
      'https://csrc.nist.gov/projects/post-quantum-cryptography',
      'NIST Post-Quantum Cryptography Standardization',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600'
    );

    insertFact.run(
      'Attention Mechanism: The Spark Behind the Transformer Revolution',
      'Introduced in the seminal paper "Attention Is All You Need", self-attention allows a neural network to weigh the contextual importance of all words in a sequence simultaneously rather than reading sequentially like an RNN.',
      'When reading "The animal didn\'t cross the street because it was too tired", the attention matrix links "it" directly to "animal" rather than "street".',
      'Artificial Intelligence',
      '2026-11-16',
      'https://arxiv.org/abs/1706.03762',
      'NeurIPS 2017: Attention Is All You Need (Vaswani et al.)',
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600'
    );

    insertFact.run(
      'Liquid Neural Networks: Time-Continuous Adaptive AI',
      'Inspired by the microscopic nematode C. elegans, liquid networks model synaptic connections with differential equations, allowing models to adapt dynamically to changing environmental inputs even after training.',
      'Autonomous drones powered by liquid networks can follow targets through dense forests without requiring hundreds of gigabytes of training flight hours.',
      'Machine Learning',
      '2026-11-15',
      'https://news.mit.edu/2021/machine-learning-adapts-0128',
      'MIT Computer Science & Artificial Intelligence Laboratory (CSAIL)',
      'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600'
    );
  }

  // 6. Initial Puzzle Questions
  const existingPuzzles = db.prepare('SELECT COUNT(*) as count FROM puzzle_questions').get().count;
  if (existingPuzzles === 0) {
    const insertPuzzle = db.prepare(`
      INSERT INTO puzzle_questions (
        game_type, title, question_text, code_snippet, options_json,
        correct_option_index, explanation, difficulty, points_reward,
        is_daily_challenge, challenge_date, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    // 1. Daily Brain Teaser
    insertPuzzle.run(
      'brain_teaser',
      'The 8-Ball Balance Weighing Riddle',
      'You have 8 identical-looking billiard balls. One of them is slightly heavier than the other 7. You have a traditional two-pan balance scale. What is the MINIMUM number of weighings required to guarantee finding the heavy ball?',
      null,
      JSON.stringify(['1 weighing', '2 weighings', '3 weighings', '4 weighings']),
      1, // 2 weighings
      'Divide the 8 balls into groups: 3, 3, and 2. Weigh 3 vs 3. If balanced, the heavy ball is in the remaining 2 (weigh 1 vs 1 = 2 weighings total). If unbalanced, take the heavier group of 3, weigh 1 vs 1: if balanced, the 3rd is heavy; if not, the scale reveals it. Exactly 2 weighings are sufficient.',
      'Medium',
      15,
      1,
      new Date().toISOString().split('T')[0]
    );

    // 2. Coding Puzzle
    insertPuzzle.run(
      'coding_puzzle',
      'JavaScript Event Loop & Microtask Priority',
      'What will be printed to the console when the following JavaScript code executes?',
      `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`,
      JSON.stringify(['1, 2, 3, 4', '1, 4, 2, 3', '1, 4, 3, 2', '3, 1, 4, 2']),
      2, // '1, 4, 3, 2'
      'Synchronous code executes first: "1" then "4". Microtasks (Promise.then) run before Macrotasks (setTimeout): so "3" logs before "2". Total order: 1, 4, 3, 2.',
      'Medium',
      15,
      0,
      null
    );

    // 3. Mathematical Challenge
    insertPuzzle.run(
      'math_challenge',
      'Algorithmic Number Series Induction',
      'Find the missing integer in the following series: 2, 6, 12, 20, 30, 42, ?',
      null,
      JSON.stringify(['48', '54', '56', '60']),
      2, // 56
      'Each term equals n * (n + 1) for n = 1, 2, 3, 4, 5, 6, 7. Thus for n = 7: 7 * 8 = 56. Alternatively, differences increase by 2: +4, +6, +8, +10, +12, +14 (42 + 14 = 56).',
      'Easy',
      10,
      0,
      null
    );

    // 4. Logical Reasoning
    insertPuzzle.run(
      'logical_reasoning',
      'Knights and Knaves Island Deduction',
      'On an island, Knights always tell the truth and Knaves always lie. You meet two islanders, A and B. Islander A says: "At least one of us is a Knave." What are A and B?',
      null,
      JSON.stringify([
        'Both A and B are Knaves',
        'A is a Knight and B is a Knave',
        'A is a Knave and B is a Knight',
        'Both A and B are Knights'
      ]),
      1, // A is Knight, B is Knave
      'If A were a Knave, his statement would be false, meaning neither is a Knave (both are Knights), a contradiction. Hence, A must be a Knight telling the truth. Since his statement is true, at least one is a Knave, which means B must be the Knave.',
      'Hard',
      20,
      0,
      null
    );

    // 5. General Tech Quiz
    insertPuzzle.run(
      'tech_quiz',
      'GPU Tensor Cores vs Standard CUDA Cores',
      'What specialized mathematical operation are NVIDIA Tensor Cores hardware-accelerated to perform in a single clock cycle?',
      null,
      JSON.stringify([
        'Fast Fourier Transform (FFT)',
        'Mixed-Precision Matrix Multiply-Accumulate (MMA: D = A * B + C)',
        'Ray-tracing Bounding Volume Hierarchy (BVH) traversal',
        'Cryptographic SHA-256 hash rounds'
      ]),
      1, // Mixed-Precision Matrix Multiply-Accumulate
      'Tensor Cores are specialized hardware execution units designed specifically for Mixed-Precision Matrix Multiply and Accumulate (D = A * B + C) operations, which form the bedrock of neural network forward passes and backpropagation.',
      'Medium',
      10,
      0,
      null
    );

    // 6. Coding Puzzle 2 (Python Scoping)
    insertPuzzle.run(
      'coding_puzzle',
      'Python Late-Binding Closure Gotcha',
      'What is the output of the following Python snippet?',
      `funcs = [lambda x: x + i for i in range(3)]
print([f(10) for f in funcs])`,
      JSON.stringify(['[10, 11, 12]', '[12, 12, 12]', '[10, 10, 10]', 'TypeError']),
      1, // [12, 12, 12]
      'In Python, closures bind variables by reference, not value. By the time the functions execute, the loop has completed and i = 2 for all closures. Thus 10 + 2 = 12 for all three functions: [12, 12, 12].',
      'Hard',
      20,
      0,
      null
    );
  }

  // 7. Upgraded Big Tech Events & Hackathons
  const existingBigTech = db.prepare("SELECT COUNT(*) as count FROM events WHERE organizer != 'NIAT'").get().count;
  if (existingBigTech === 0) {
    const insertEvent = db.prepare(`
      INSERT INTO events (
        title, category, description, event_date, start_time, end_time,
        location_type, venue_or_link, speaker_name, speaker_title, capacity, status,
        organizer, registration_url, registration_deadline, eligibility_criteria,
        banner_url, is_featured, source_verified, last_verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvent.run(
      'Google Cloud GenAI Hackathon 2026',
      'Hackathons',
      'Build autonomous AI agents, multimodal search engines, and real-time reasoning applications using Google Gemini 2.0 and Vertex AI. Top 3 teams win cash grants of ₹5,00,000 and direct interview tracks at leading AI labs.',
      '2026-12-12',
      '09:00 AM',
      '06:00 PM',
      'Online',
      'https://developers.google.com/events/genai-hackathon',
      'Sundar Pichai & Google Developer Relations',
      'Developer Keynote',
      500,
      'Google',
      'https://developers.google.com/events/genai-hackathon',
      '2026-12-05',
      'Open to all engineering students and aspiring developers across India.',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      1,
      'Verified via Official Google Developers Portal',
      '2026-11-19'
    );

    insertEvent.run(
      'Smart India Hackathon 2026 – NIAT Campus Qualifier',
      'Hackathons',
      'National flagship innovation challenge by Ministry of Education. NIAT internal qualifier to shortlist teams representing the institute in AI, smart automation, and cybersecurity problem statements.',
      '2026-12-18',
      '10:00 AM',
      '05:00 PM',
      'Campus',
      'NIAT Innovation & Incubation Center, Academic Block B, Hyderabad',
      'Prof. Dr. Rajesh Rao',
      'Dean of Academic Competitions',
      200,
      'NIAT',
      'https://niat.edu.in/sih-2026',
      '2026-12-10',
      'Enrolled and prospective NIAT Class 12 and B.Tech candidates.',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
      1,
      'Verified NIAT Academic Council',
      '2026-11-19'
    );

    insertEvent.run(
      'Google I/O Extended 2026 – Bengaluru Campus Watch Party',
      'Big Tech Events',
      'Join fellow developers, student innovators, and Google Developer Experts for live deep dives into Android, Flutter, WebAssembly, and Gemini reasoning architectures.',
      '2026-12-22',
      '02:00 PM',
      '07:00 PM',
      'Online',
      'https://io.google/2026/extended',
      'Google Developer Group (GDG) India',
      'Community Organizers',
      350,
      'Google',
      'https://io.google/2026/extended',
      '2026-12-20',
      'Free admission for student developers. Pre-registration mandatory.',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
      1,
      'Verified Google Developer Groups Network',
      '2026-11-19'
    );

    insertEvent.run(
      'NVIDIA GTC AI Developer Workshop: Hands-on LLM Fine-Tuning',
      'AI and Machine Learning Events',
      'Interactive masterclass on Low-Rank Adaptation (LoRA), Quantization (QLoRA), and deploying high-throughput inference endpoints with NVIDIA TensorRT-LLM and Triton.',
      '2026-12-28',
      '04:00 PM',
      '07:00 PM',
      'Online',
      'https://www.nvidia.com/gtc/developer-workshops',
      'NVIDIA Deep Learning Institute (DLI)',
      'Certified Instructors',
      300,
      'NVIDIA',
      'https://www.nvidia.com/gtc/developer-workshops',
      '2026-12-25',
      'Basic knowledge of Python and PyTorch recommended.',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
      1,
      'Verified NVIDIA Deep Learning Institute',
      '2026-11-19'
    );

    insertEvent.run(
      'Microsoft Build 2026 Student AI Showcase',
      'Developer Conferences',
      'Global student track featuring Copilot stack extensions, Semantic Kernel, and deploying scalable cloud intelligence on Microsoft Azure.',
      '2027-01-08',
      '03:30 PM',
      '06:30 PM',
      'Online',
      'https://build.microsoft.com/student-zone',
      'Microsoft Learn Student Ambassadors',
      'Program Mentors',
      400,
      'Microsoft',
      'https://build.microsoft.com/student-zone',
      '2027-01-04',
      'Open to all enrolled students with active GitHub Student Developer Pack.',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
      0,
      'Verified Microsoft Learn Network',
      '2026-11-19'
    );
  }

  // 8. Initialize Streaks for Rahul Sharma
  db.prepare(`
    INSERT OR REPLACE INTO student_streaks (user_id, current_streak, longest_streak, last_attempt_date, total_games_played, total_correct, total_game_points)
    VALUES (2, 3, 5, ?, 6, 5, 65)
  `).run(new Date().toISOString().split('T')[0]);

  console.log('✅ NIAT Connect 2.0 expansion data initialized successfully.');
}

module.exports = seedDatabase;
module.exports.seedDatabase = seedDatabase;
module.exports.seedNiat2Expansion = seedNiat2Expansion;

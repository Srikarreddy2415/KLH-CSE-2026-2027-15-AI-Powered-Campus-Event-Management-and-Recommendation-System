"""
Dataset Generator for CampusConnect.
Generates synthetic events.csv, users.csv, interactions.csv, attendance.csv
Run: python scripts/generate_dataset.py
"""

import csv, random, uuid
from datetime import datetime, timedelta, date

random.seed(42)

BASE_DATE = date(2025, 8, 1)

# ─── Categories and tags ─────────────────────────────────────────────────────
CATEGORIES = [
    "Artificial Intelligence", "Machine Learning", "Data Science", "Python",
    "Web Development", "App Development", "Cybersecurity", "Cloud Computing",
    "Programming", "Hackathon", "Coding Competition", "Entrepreneurship",
    "Startup", "Career", "Placement", "Robotics", "IoT", "Cultural",
    "Sports", "Gaming", "Photography", "Networking", "Workshop", "Seminar",
]

TAGS_MAP = {
    "Artificial Intelligence": ["AI", "GenAI", "LLM", "NLP", "Computer Vision", "Deep Learning"],
    "Machine Learning": ["ML", "Neural Networks", "PyTorch", "TensorFlow", "Scikit-learn", "Data"],
    "Data Science": ["Data Analysis", "Pandas", "NumPy", "Visualization", "Statistics", "SQL"],
    "Python": ["Python3", "Django", "Flask", "FastAPI", "Automation", "Scripting"],
    "Web Development": ["React", "Node.js", "HTML", "CSS", "JavaScript", "TypeScript", "REST API"],
    "App Development": ["Flutter", "React Native", "Android", "iOS", "Kotlin", "Swift"],
    "Cybersecurity": ["Ethical Hacking", "CTF", "Penetration Testing", "Network Security", "VAPT"],
    "Cloud Computing": ["AWS", "GCP", "Azure", "DevOps", "Docker", "Kubernetes"],
    "Programming": ["DSA", "Competitive Programming", "C++", "Java", "Algorithms"],
    "Hackathon": ["24-Hour Hack", "Team Challenge", "Innovation", "Problem Solving"],
    "Coding Competition": ["LeetCode", "CodeForces", "ICPC", "Competitive Coding"],
    "Entrepreneurship": ["Startup Pitch", "Ideathon", "Business Plan", "Product Design"],
    "Startup": ["Funding", "MVP", "Product Market Fit", "Pitch Deck", "VC"],
    "Career": ["Resume Building", "Interview Prep", "Soft Skills", "LinkedIn"],
    "Placement": ["Aptitude", "Mock Interview", "HR Interview", "Technical Interview"],
    "Robotics": ["Arduino", "ROS", "Automation", "Drone", "Embedded Systems"],
    "IoT": ["Raspberry Pi", "Sensors", "Smart Devices", "MQTT", "Edge Computing"],
    "Cultural": ["Dance", "Music", "Drama", "Art", "Performance", "Festival"],
    "Sports": ["Cricket", "Football", "Basketball", "Athletics", "Table Tennis"],
    "Gaming": ["Esports", "BGMI", "Valorant", "Game Dev", "Unity"],
    "Photography": ["DSLR", "Portrait", "Editing", "Lightroom", "Street Photography"],
    "Networking": ["Professional Networking", "Alumni Meet", "Industry Connect"],
    "Workshop": ["Hands-on", "Practical", "Skill Building", "Project"],
    "Seminar": ["Guest Lecture", "Panel Discussion", "Industry Talk", "Research"],
}

CITIES = ["Vijayawada", "Hyderabad", "Bengaluru", "Chennai", "Pune", "Mumbai", "Delhi", "Online"]
MODES = ["offline", "online", "hybrid"]
ORGANIZERS_GENERAL = [
    "TechFest India", "HackClub India", "Google Developer Groups", "AWS Community",
    "Microsoft Learn", "NASSCOM", "CII", "StartupIndia", "FICCI", "ACM India",
    "IEEE", "PyConf India", "ReactConf India", "AngelList India",
]
ORGANIZERS_KLU = [
    "KLU CSE Department", "KLU ECE Department", "KLU IT Department",
    "KLU CSIT Club", "KLU Innovation Hub", "KLU Cultural Committee",
    "KLU Sports Committee", "KLU Entrepreneurship Cell", "KLU Alumni Association",
    "KLU Coding Club", "KLU Robotics Club", "KLU Photography Club",
]

EVENT_TEMPLATES = {
    "Artificial Intelligence": [
        ("Generative AI Workshop", "An intensive workshop on building applications using Generative AI, covering Large Language Models, prompt engineering, and RAG architectures. Participants will build a simple chatbot using OpenAI APIs."),
        ("Computer Vision Bootcamp", "Learn to build computer vision applications using OpenCV and deep learning. Topics include image classification, object detection, and facial recognition systems."),
        ("AI for Everyone Seminar", "A beginner-friendly introduction to artificial intelligence concepts, real-world applications, and career opportunities in the AI domain."),
        ("LLM Fine-Tuning Workshop", "Hands-on session on fine-tuning large language models using HuggingFace Transformers for domain-specific applications."),
        ("AI in Healthcare Symposium", "Explore how artificial intelligence is revolutionizing healthcare — from diagnostic imaging to drug discovery and patient outcome prediction."),
    ],
    "Machine Learning": [
        ("ML Model Deployment Workshop", "Learn to deploy machine learning models to production using FastAPI, Docker, and cloud platforms. Includes model monitoring and versioning best practices."),
        ("Machine Learning Hackathon", "A 24-hour hackathon where teams compete to build the best ML solution for real-world problems provided by industry partners."),
        ("Deep Learning Fundamentals", "Comprehensive introduction to neural networks, backpropagation, CNNs, RNNs, and transformers with hands-on coding exercises in PyTorch."),
        ("Feature Engineering Masterclass", "Master the art of feature engineering — handling missing data, encoding, scaling, and creating domain-specific features for better ML performance."),
    ],
    "Data Science": [
        ("Data Science with Python Bootcamp", "Three-day intensive bootcamp covering data analysis with Pandas, visualization with Matplotlib and Seaborn, and machine learning with Scikit-learn."),
        ("SQL for Data Scientists", "Comprehensive SQL workshop covering complex queries, window functions, CTEs, and database optimization techniques for data analysis workflows."),
        ("Data Visualization Workshop", "Learn to create compelling data stories using Python's visualization libraries and Tableau. Covers best practices for effective data communication."),
    ],
    "Python": [
        ("Python for Beginners Workshop", "Hands-on introduction to Python programming covering syntax, data structures, functions, file handling, and simple automation scripts."),
        ("Advanced Python Workshop", "Deep dive into Python's advanced features: decorators, generators, context managers, async/await, and performance optimization techniques."),
        ("Django Web Development", "Build production-ready web applications using Django. Covers models, views, templates, authentication, REST APIs, and deployment."),
        ("Python Automation Workshop", "Learn to automate repetitive tasks using Python — web scraping, file processing, email automation, and API integrations."),
    ],
    "Web Development": [
        ("React.js Masterclass", "Comprehensive React workshop covering hooks, state management, routing, API integration, and building a complete full-stack application."),
        ("Full Stack Web Development Bootcamp", "Learn to build complete web applications using React, Node.js, Express, and MongoDB. Includes authentication, deployment, and best practices."),
        ("Next.js Workshop", "Build modern web applications with Next.js — server-side rendering, static generation, API routes, and performance optimization."),
        ("TypeScript for React Developers", "Adopt TypeScript in your React projects — type safety, generics, utility types, and migration strategies from JavaScript."),
    ],
    "App Development": [
        ("Flutter Mobile App Development", "Build cross-platform mobile apps using Flutter and Dart. Covers widgets, state management, API integration, and app store deployment."),
        ("Android Development with Kotlin", "Introduction to Android app development using Kotlin and Jetpack Compose. Build a complete Android application from scratch."),
        ("React Native Workshop", "Build mobile applications for iOS and Android using React Native and Expo. Covers navigation, native APIs, and publishing to app stores."),
    ],
    "Cybersecurity": [
        ("Ethical Hacking Workshop", "Learn ethical hacking techniques — reconnaissance, vulnerability scanning, exploitation, and reporting. Practical exercises using Kali Linux."),
        ("Capture The Flag Competition", "Team-based cybersecurity competition testing skills in web security, cryptography, forensics, reverse engineering, and network security."),
        ("Network Security Fundamentals", "Understand network security concepts — firewalls, VPNs, intrusion detection, and network monitoring tools. Practical lab exercises included."),
    ],
    "Cloud Computing": [
        ("AWS Fundamentals Workshop", "Get started with Amazon Web Services — EC2, S3, RDS, Lambda, and key services. Includes hands-on labs with a free-tier account."),
        ("DevOps with Docker and Kubernetes", "Learn to containerize applications with Docker and orchestrate with Kubernetes. Covers CI/CD pipelines and infrastructure as code."),
        ("Cloud Architecture Design Workshop", "Learn to design scalable, reliable, and cost-effective cloud architectures following AWS Well-Architected Framework best practices."),
    ],
    "Programming": [
        ("Data Structures and Algorithms Bootcamp", "Master DSA concepts essential for technical interviews — arrays, linked lists, trees, graphs, dynamic programming, and problem-solving strategies."),
        ("Competitive Programming Workshop", "Level up your competitive programming skills — advanced algorithms, optimization techniques, and strategies for coding competitions like ICPC and CodeForces."),
        ("Clean Code Workshop", "Learn to write clean, maintainable code using SOLID principles, design patterns, code review best practices, and refactoring techniques."),
    ],
    "Hackathon": [
        ("National Level Hackathon 2025", "36-hour national hackathon bringing together 500+ developers to solve real-world problems in healthcare, agriculture, education, and smart cities. Prize pool: ₹5 Lakhs."),
        ("Smart India Hackathon Internal Qualifier", "Internal qualifier for Smart India Hackathon — teams of 6 solve government-provided problem statements across multiple domains."),
        ("AI Hackathon by Google", "Build innovative AI-powered solutions using Google Cloud AI services. Mentored by Google engineers. Top teams win cloud credits and internship opportunities."),
    ],
    "Coding Competition": [
        ("Code Sprint — Monthly Coding Challenge", "Monthly competitive coding contest with problems ranging from beginner to expert level. Top performers win prizes and recognition on the leaderboard."),
        ("Algorithm Championship", "Inter-college algorithm competition testing problem-solving, time complexity optimization, and implementation skills. Individual participation."),
        ("KLU Code Wars", "Annual coding competition exclusively for KL University students. Categories: beginner, intermediate, and expert. Prizes for top 10 performers."),
    ],
    "Entrepreneurship": [
        ("Startup Ideathon 2025", "Pitch your startup idea to a panel of investors and entrepreneurs. Best ideas receive mentorship, seed funding opportunities, and incubation support."),
        ("Entrepreneurship Bootcamp", "Intensive two-day bootcamp on building a startup — ideation, market research, business modeling, MVP development, and pitching."),
        ("Product Management Workshop", "Learn the fundamentals of product management — user research, roadmap planning, agile development, metrics, and stakeholder management."),
    ],
    "Startup": [
        ("Founder's Meetup — Hyderabad Edition", "Networking event for startup founders, co-founders, and early-stage entrepreneurs. Share experiences, find co-founders, and meet potential investors."),
        ("VC Connect 2025", "Meet venture capitalists, angel investors, and startup accelerators. Pitch your startup and get feedback from leading investors in the Indian startup ecosystem."),
    ],
    "Career": [
        ("Resume Workshop and Mock Interviews", "Learn to craft an impressive resume and practice mock interviews with industry professionals. Get personalized feedback on your interview performance."),
        ("LinkedIn Profile Optimization Workshop", "Build a powerful LinkedIn presence — profile optimization, networking strategies, content creation, and using LinkedIn for job searching."),
        ("Soft Skills for Tech Professionals", "Develop essential soft skills for a successful tech career — communication, teamwork, leadership, time management, and emotional intelligence."),
    ],
    "Placement": [
        ("Placement Preparation Workshop", "Comprehensive placement preparation — aptitude, reasoning, verbal ability, technical interview preparation, and HR interview techniques."),
        ("Mock Placement Drives", "Practice placement drives simulating actual company recruitment processes — written test, group discussion, technical interview, and HR interview rounds."),
        ("Top Companies Career Fair", "Annual career fair featuring 50+ top companies recruiting for internship and full-time positions. Bring your resume and dress professionally."),
    ],
    "Robotics": [
        ("Robotics Workshop for Beginners", "Hands-on introduction to robotics — Arduino programming, sensor integration, motor control, and building your first autonomous robot."),
        ("Drone Racing Championship", "Inter-college FPV drone racing championship. Participants can bring their own drones or use club drones. Racing, obstacle course, and freestyle categories."),
        ("ROS 2 Workshop", "Introduction to Robot Operating System 2 (ROS 2) — nodes, topics, services, actions, and building simulated robots using Gazebo."),
    ],
    "IoT": [
        ("IoT Fundamentals Workshop", "Build your first IoT project — Raspberry Pi setup, sensor integration, MQTT communication, cloud connectivity, and home automation basics."),
        ("Smart Agriculture using IoT", "Explore IoT applications in precision agriculture — soil monitoring, automated irrigation, crop disease detection, and data analytics for farmers."),
    ],
    "Cultural": [
        ("Annual Cultural Festival — Tarang 2025", "KLU's premier cultural festival featuring dance competitions, music performances, drama, art exhibitions, fashion show, and celebrity performances."),
        ("Dance Competition — Rhythm 2025", "Inter-college dance competition with categories: classical, folk, western, fusion, and group performance. Cash prizes and trophies for winners."),
        ("Music Concert — KLU Unplugged", "Live music concert by KLU students featuring acoustic performances, bands, solo singers, and special guest artists."),
    ],
    "Sports": [
        ("Inter-College Cricket Tournament", "Annual inter-college cricket tournament in T20 format. Teams of 11 players. Play-off format with finals on the last day. Prizes for winners and runners-up."),
        ("Annual Sports Day 2025", "KLU's annual sports day featuring athletics, team sports, individual events, and closing ceremony with prize distribution."),
        ("Basketball Championship", "Inter-college basketball championship — men's and women's categories. Round-robin format in group stage, followed by knock-out rounds."),
    ],
    "Gaming": [
        ("BGMI Tournament — KLU Showdown", "BGMI esports tournament — squads of 4. Online qualifying rounds followed by LAN finals at KLU gaming arena. Prize pool: ₹50,000."),
        ("Valorant Championship", "Valorant esports tournament — 5v5 team format. Qualifiers, semi-finals, and grand finals. Organized by KLU Gaming Club."),
        ("Game Development Workshop", "Learn to build your first 2D game using Unity and C#. Covers game design principles, physics, animation, UI, and publishing to mobile platforms."),
    ],
    "Photography": [
        ("Photography Workshop — Basics to DSLR", "Learn photography fundamentals — exposure triangle, composition rules, lighting, and post-processing techniques using Adobe Lightroom."),
        ("Campus Photography Competition", "Annual campus-wide photography competition with themes: Nature, Architecture, People, and Abstract. Prizes for top photographers in each category."),
    ],
    "Networking": [
        ("Tech Professionals Networking Night", "Evening networking event for tech professionals, students, and industry leaders. Expand your professional network, share opportunities, and make meaningful connections."),
        ("Alumni Networking Event", "Annual alumni meet-and-greet connecting current KLU students with alumni working at top companies. Career guidance, job referrals, and mentorship opportunities."),
    ],
    "Workshop": [
        ("Public Speaking and Presentation Skills", "Overcome stage fright and learn to deliver confident, compelling presentations. Practical exercises, video feedback, and personalized coaching."),
        ("Technical Writing Workshop", "Learn to write clear technical documentation, API docs, blog posts, and research papers. Essential skill for developers and data scientists."),
    ],
    "Seminar": [
        ("Future of Technology Seminar 2025", "Industry leaders discuss emerging technologies — AI, quantum computing, blockchain, extended reality, and their impact on society and careers."),
        ("Research Paper Writing Workshop", "Learn to write and publish research papers — literature review, methodology, results presentation, and submission to IEEE and ACM conferences."),
    ],
}

INTERESTS_POOL = [
    "Artificial Intelligence", "Machine Learning", "Python", "Web Development",
    "App Development", "Data Science", "Cybersecurity", "Cloud Computing",
    "Programming", "Hackathons", "Coding Competitions", "Entrepreneurship",
    "Startups", "Career", "Placement", "Robotics", "IoT", "Cultural",
    "Sports", "Music", "Gaming", "Photography", "Networking", "Workshops", "Seminars",
]

USER_NAMES = [
    "Arjun Sharma", "Priya Reddy", "Sai Kumar", "Ananya Singh", "Rahul Verma",
    "Kavya Patel", "Aditya Nair", "Sneha Rao", "Vikram Iyer", "Divya Krishnan",
    "Nikhil Mehta", "Shreya Gupta", "Rajan Pillai", "Pooja Malhotra", "Suresh Babu",
    "Lakshmi Devi", "Harish Chandra", "Meghana Reddy", "Kiran Teja", "Yamini Prasad",
    "Rohit Kumar", "Preethi Nair", "Siddharth Rao", "Bhavya Singh", "Manoj Kumar",
    "Swathi Reddy", "Venkat Rao", "Pavani Devi", "Chaitanya Babu", "Keerthi Sharma",
    "Abhijeet Verma", "Lavanya Iyer", "Sachin Patel", "Manasa Gupta", "Dinesh Kumar",
    "Varshini Rao", "Akshay Mehta", "Revathi Krishnan", "Prashanth Nair", "Sunitha Babu",
    "Gowtham Reddy", "Deepika Singh", "Aravind Kumar", "Mounika Sharma", "Rajesh Patel",
    "Sirisha Rao", "Nithin Verma", "Padmavathi Iyer", "Balaji Kumar", "Tejaswi Reddy",
]

def random_date(start_offset=10, end_offset=200):
    delta = random.randint(start_offset, end_offset)
    return BASE_DATE + timedelta(days=delta)

def random_time():
    hour = random.choice([9, 10, 11, 14, 15, 16])
    return f"{hour:02d}:00:00"

def random_end_time(start_time):
    sh = int(start_time[:2])
    duration = random.choice([2, 3, 4, 6, 8])
    eh = min(sh + duration, 22)
    return f"{eh:02d}:00:00"

# ─── Generate Events ──────────────────────────────────────────────────────────
def generate_events():
    events = []

    # 60 general + 40 college events
    general_targets = []
    college_targets = []

    for cat in CATEGORIES:
        templates = EVENT_TEMPLATES.get(cat, [])
        for title, description in templates:
            city = random.choice([c for c in CITIES if c != "Online"])
            mode = random.choice(MODES)
            organizer = random.choice(ORGANIZERS_GENERAL)
            event_date = random_date()
            start_time = random_time()
            end_time = random_end_time(start_time)
            tags = random.sample(TAGS_MAP.get(cat, [cat]), min(4, len(TAGS_MAP.get(cat, [cat]))))
            capacity = random.choice([50, 60, 75, 80, 100, 120, 200, 400])
            expected = int(capacity * random.uniform(0.5, 0.95))
            general_targets.append({
                "event_id": str(uuid.uuid4()),
                "title": title,
                "description": description,
                "category": cat,
                "tags": "|".join(tags),
                "event_type": "general",
                "location": f"Convention Center, {city}",
                "city": city,
                "date": event_date.isoformat(),
                "start_time": start_time,
                "end_time": end_time,
                "mode": mode,
                "college_scope": False,
                "college_id": "",
                "expected_participants": expected,
                "capacity": capacity,
                "organizer": organizer,
            })

    for cat in CATEGORIES:
        templates = EVENT_TEMPLATES.get(cat, [])
        if templates:
            title, description = templates[0]
            title = f"[KLU] {title}"
            city = "Vijayawada"
            mode = "offline"
            organizer = random.choice(ORGANIZERS_KLU)
            event_date = random_date()
            start_time = random_time()
            end_time = random_end_time(start_time)
            tags = random.sample(TAGS_MAP.get(cat, [cat]), min(4, len(TAGS_MAP.get(cat, [cat]))))
            capacity = random.choice([50, 60, 75, 80, 100, 120])
            expected = int(capacity * random.uniform(0.5, 0.95))
            college_targets.append({
                "event_id": str(uuid.uuid4()),
                "title": title,
                "description": description,
                "category": cat,
                "tags": "|".join(tags),
                "event_type": "college",
                "location": "KL University, Vijayawada",
                "city": city,
                "date": event_date.isoformat(),
                "start_time": start_time,
                "end_time": end_time,
                "mode": mode,
                "college_scope": True,
                "college_id": "KLU",
                "expected_participants": expected,
                "capacity": capacity,
                "organizer": organizer,
            })

    random.shuffle(general_targets)
    random.shuffle(college_targets)
    events = general_targets[:60] + college_targets[:40]
    return events


# ─── Generate Users ───────────────────────────────────────────────────────────
def generate_users():
    users = []
    # Predefined interest profiles
    profiles = [
        ["Artificial Intelligence", "Machine Learning", "Python", "Data Science"],
        ["Web Development", "App Development", "JavaScript", "React"],
        ["Cybersecurity", "Networking", "Ethical Hacking", "Cloud Computing"],
        ["Entrepreneurship", "Startups", "Career", "Placement"],
        ["Robotics", "IoT", "Embedded Systems", "Arduino"],
        ["Machine Learning", "Data Science", "Python", "Programming"],
        ["Cloud Computing", "DevOps", "AWS", "Docker"],
        ["Gaming", "Esports", "Game Development", "Programming"],
        ["Cultural", "Music", "Photography", "Sports"],
        ["Hackathons", "Coding Competitions", "Programming", "Algorithms"],
    ]

    for i, name in enumerate(USER_NAMES):
        profile = profiles[i % len(profiles)]
        user_interests = profile + random.sample(INTERESTS_POOL, 2)
        user_interests = list(set(user_interests))[:6]
        college_verified = random.random() < 0.7
        location = random.choice(["Vijayawada", "Hyderabad", "Bengaluru", "Chennai", "Pune"])

        users.append({
            "user_id": str(uuid.uuid4()),
            "name": name,
            "location": location,
            "college_id": "KLU" if college_verified else "",
            "college_verified": college_verified,
            "interests": "|".join(user_interests),
            "preferred_mode": random.choice(["online", "offline", "both"]),
        })
    return users


# ─── Generate Interactions ────────────────────────────────────────────────────
def generate_interactions(users, events):
    interactions = []
    events_by_cat = {}
    for e in events:
        events_by_cat.setdefault(e["category"], []).append(e)

    for user in users:
        user_interests = user["interests"].split("|")
        # Give each user 8-15 interactions, biased toward their interests
        num_interactions = random.randint(8, 15)
        interacted = set()

        # Biased: pick from matching categories
        matching_events = []
        for interest in user_interests:
            cat_match = [c for c in CATEGORIES if interest.lower() in c.lower() or c.lower() in interest.lower()]
            for cat in cat_match:
                matching_events.extend(events_by_cat.get(cat, []))

        # Fill with random events
        all_candidates = matching_events + random.sample(events, min(10, len(events)))
        seen_ids = set()
        candidates = []
        for e in all_candidates:
            if e["event_id"] not in seen_ids:
                seen_ids.add(e["event_id"])
                candidates.append(e)

        sample_count = min(num_interactions, len(candidates))
        selected = random.sample(candidates, sample_count)

        for event in selected:
            # Skip college events for non-verified users
            if event["college_scope"] == "True" or event["college_scope"] is True:
                if not user["college_verified"]:
                    continue

            viewed = True
            saved = random.random() < 0.4
            registered = random.random() < 0.6
            attended = registered and random.random() < 0.7
            rating = random.randint(3, 5) if attended and random.random() < 0.5 else None

            interactions.append({
                "interaction_id": str(uuid.uuid4()),
                "user_id": user["user_id"],
                "event_id": event["event_id"],
                "viewed": viewed,
                "saved": saved,
                "registered": registered,
                "attended": attended,
                "rating": rating or "",
                "interaction_date": (BASE_DATE + timedelta(days=random.randint(1, 100))).isoformat(),
            })

    return interactions[:500]


# ─── Generate Attendance ──────────────────────────────────────────────────────
def generate_attendance(interactions):
    records = []
    attended = [i for i in interactions if i["attended"]]

    for interaction in attended[:200]:
        entry_time = datetime.combine(
            date.fromisoformat(interaction["interaction_date"]),
            datetime.strptime("09:00:00", "%H:%M:%S").time()
        ) + timedelta(minutes=random.randint(0, 30))

        # 80% fully verified, 20% only entry verified
        fully_verified = random.random() < 0.8
        exit_verified = fully_verified
        attendance_verified = fully_verified
        sil_credit = fully_verified

        exit_time = entry_time + timedelta(hours=random.randint(2, 6)) if exit_verified else None

        records.append({
            "attendance_id": str(uuid.uuid4()),
            "user_id": interaction["user_id"],
            "event_id": interaction["event_id"],
            "entry_time": entry_time.isoformat(),
            "exit_time": exit_time.isoformat() if exit_time else "",
            "entry_verified": True,
            "exit_verified": exit_verified,
            "attendance_verified": attendance_verified,
            "sil_credit": sil_credit,
        })

    return records


if __name__ == "__main__":
    import os
    OUT = os.path.join(os.path.dirname(__file__), "..", "dataset")
    os.makedirs(OUT, exist_ok=True)

    print("Generating dataset...")
    events  = generate_events()
    users   = generate_users()
    interactions = generate_interactions(users, events)
    attendance   = generate_attendance(interactions)

    def write_csv(filename, rows, fieldnames):
        path = os.path.join(OUT, filename)
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        print(f"  [OK] {filename}: {len(rows)} records -> {path}")

    write_csv("events.csv", events, ["event_id","title","description","category","tags","event_type","location","city","date","start_time","end_time","mode","college_scope","college_id","expected_participants","capacity","organizer"])
    write_csv("users.csv", users, ["user_id","name","location","college_id","college_verified","interests","preferred_mode"])
    write_csv("interactions.csv", interactions, ["interaction_id","user_id","event_id","viewed","saved","registered","attended","rating","interaction_date"])
    write_csv("attendance.csv", attendance, ["attendance_id","user_id","event_id","entry_time","exit_time","entry_verified","exit_verified","attendance_verified","sil_credit"])

    print("\nDataset generation complete!")
    print(f"   Events:       {len(events)}")
    print(f"   Users:        {len(users)}")
    print(f"   Interactions: {len(interactions)}")
    print(f"   Attendance:   {len(attendance)}")

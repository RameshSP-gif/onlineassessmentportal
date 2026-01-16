const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://root:Rakshita%401234@cluster0.pp8rwbt.mongodb.net/assessmentdb?retryWrites=true&w=majority';

async function seedInterviews() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('assessmentdb');
    
    // Clear existing interview courses
    await db.collection('interview_courses').deleteMany({});
    console.log('🧹 Cleared existing interview courses');
    
    // Seed interview courses
    const courses = [
      {
        title: 'MERN Stack Developer Interview',
        description: 'Comprehensive technical interview for MERN Full Stack Developer position',
        duration: 45,
        fee: 200,
        questions: [
          { id: 1, question: 'Tell me about yourself and your experience with MERN stack' },
          { id: 2, question: 'Explain the difference between SQL and NoSQL databases' },
          { id: 3, question: 'How do you handle state management in React applications?' },
          { id: 4, question: 'Describe your experience with RESTful API design' },
          { id: 5, question: 'What are your salary expectations?' }
        ],
        created_at: new Date()
      },
      {
        title: 'Java Full Stack Developer Interview',
        description: 'Technical interview focusing on Java, Spring Boot, and modern frameworks',
        duration: 45,
        fee: 200,
        questions: [
          { id: 1, question: 'Introduce yourself and your Java development experience' },
          { id: 2, question: 'Explain Spring Boot auto-configuration' },
          { id: 3, question: 'What is your experience with microservices architecture?' },
          { id: 4, question: 'How do you optimize database queries in JPA/Hibernate?' },
          { id: 5, question: 'Describe a challenging project you worked on' }
        ],
        created_at: new Date()
      },
      {
        title: 'Python Developer Interview',
        description: 'Interview for Python backend development role',
        duration: 40,
        fee: 200,
        questions: [
          { id: 1, question: 'Tell me about your Python development background' },
          { id: 2, question: 'Explain decorators and generators in Python' },
          { id: 3, question: 'What is your experience with Django/Flask?' },
          { id: 4, question: 'How do you handle asynchronous programming in Python?' },
          { id: 5, question: 'What are your career goals?' }
        ],
        created_at: new Date()
      },
      {
        title: 'DevOps Engineer Interview',
        description: 'Technical interview for DevOps and Cloud Engineering position',
        duration: 45,
        fee: 200,
        questions: [
          { id: 1, question: 'Describe your DevOps experience and expertise' },
          { id: 2, question: 'Explain your CI/CD pipeline implementation' },
          { id: 3, question: 'What is your experience with Docker and Kubernetes?' },
          { id: 4, question: 'How do you monitor and troubleshoot production issues?' },
          { id: 5, question: 'Tell me about infrastructure as code tools you have used' }
        ],
        created_at: new Date()
      },
      {
        title: 'QA/Test Engineer Interview',
        description: 'Interview for Software Testing and Quality Assurance role',
        duration: 40,
        fee: 200,
        questions: [
          { id: 1, question: 'Share your testing experience and methodologies' },
          { id: 2, question: 'What is your approach to test automation?' },
          { id: 3, question: 'Explain the difference between functional and non-functional testing' },
          { id: 4, question: 'How do you prioritize test cases?' },
          { id: 5, question: 'Describe a critical bug you found and how you reported it' }
        ],
        created_at: new Date()
      }
    ];
    
    const result = await db.collection('interview_courses').insertMany(courses);
    console.log(`✅ Seeded ${result.insertedCount} interview courses`);
    
    // List all courses
    const allCourses = await db.collection('interview_courses').find({}).toArray();
    console.log('\n📚 Interview Courses:');
    allCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Duration: ${course.duration} minutes`);
      console.log(`   Fee: ₹${course.fee}`);
      console.log(`   Questions: ${course.questions.length}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

seedInterviews();

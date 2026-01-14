require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'assessment.db');
const db = new sqlite3.Database(dbPath);

// Sample exams data
const examsData = [
  {
    title: "MERN Full Stack Developer Assessment",
    description: "Advanced MERN stack concepts including MongoDB, Express, React, and Node.js",
    duration: 60,
    questions: [
      { q: "What is the purpose of useEffect hook in React?", a: "To perform side effects in functional components", b: "To create state variables", c: "To handle form submissions", d: "To define routes", correct: "a", marks: 1 },
      { q: "In MongoDB, what does the aggregate pipeline do?", a: "Creates database backups", b: "Processes data records and returns computed results", c: "Manages user authentication", d: "Handles file uploads", correct: "b", marks: 1 },
      { q: "Which middleware is used for parsing JSON in Express?", a: "body-parser", b: "express.json()", c: "multer", d: "cors", correct: "b", marks: 1 },
      { q: "What is the virtual DOM in React?", a: "A database schema", b: "A lightweight copy of the actual DOM", c: "A CSS framework", d: "A routing library", correct: "b", marks: 1 },
      { q: "How do you prevent SQL injection in Node.js with MongoDB?", a: "Using parameterized queries", b: "Escaping special characters", c: "MongoDB is not vulnerable to SQL injection", d: "Using stored procedures", correct: "c", marks: 1 },
      { q: "What is the purpose of Redux Thunk?", a: "To handle asynchronous actions in Redux", b: "To create React components", c: "To manage MongoDB connections", d: "To handle routing", correct: "a", marks: 1 },
      { q: "In Express.js, what is the difference between app.use() and app.get()?", a: "app.use() is for middleware, app.get() is for GET routes", b: "They are the same", c: "app.use() is deprecated", d: "app.get() is for all HTTP methods", correct: "a", marks: 1 },
      { q: "What is the purpose of React Context API?", a: "To make API calls", b: "To pass data through component tree without props drilling", c: "To handle animations", d: "To manage forms", correct: "b", marks: 1 },
      { q: "Which hook is used for memoization in React?", a: "useState", b: "useEffect", c: "useMemo", d: "useCallback", correct: "c", marks: 1 },
      { q: "What is the purpose of JWT in authentication?", a: "To encrypt passwords", b: "To create stateless authentication tokens", c: "To manage sessions", d: "To handle CORS", correct: "b", marks: 1 },
      { q: "In MongoDB, what is the purpose of indexing?", a: "To improve query performance", b: "To backup data", c: "To create relationships", d: "To validate schemas", correct: "a", marks: 1 },
      { q: "What is the difference between controlled and uncontrolled components in React?", a: "Controlled components use refs, uncontrolled use state", b: "Controlled components manage form data via state, uncontrolled use DOM", c: "No difference", d: "Controlled components are class-based only", correct: "b", marks: 1 },
      { q: "What does CORS stand for and why is it important?", a: "Cross-Origin Resource Sharing, allows secure cross-domain requests", b: "Centralized Origin Request System, manages API calls", c: "Client Origin Resource Server, handles authentication", d: "Cross-Origin Request Security, encrypts data", correct: "a", marks: 1 },
      { q: "What is the purpose of useReducer hook?", a: "To reduce bundle size", b: "To manage complex state logic", c: "To handle API calls", d: "To optimize performance", correct: "b", marks: 1 },
      { q: "In Express, what is the purpose of middleware like helmet?", a: "To secure HTTP headers", b: "To handle authentication", c: "To parse JSON", d: "To manage routes", correct: "a", marks: 1 },
      { q: "What is React.memo() used for?", a: "To memoize API calls", b: "To prevent unnecessary re-renders of functional components", c: "To create context", d: "To manage state", correct: "b", marks: 1 },
      { q: "What is the purpose of mongoose in MERN stack?", a: "To create React components", b: "To provide ODM for MongoDB", c: "To handle routing", d: "To manage authentication", correct: "b", marks: 1 },
      { q: "What is the difference between SSR and CSR in React?", a: "SSR renders on server, CSR renders on client", b: "SSR is faster than CSR always", c: "CSR is deprecated", d: "They are the same", correct: "a", marks: 1 },
      { q: "What is the purpose of async/await in Node.js?", a: "To handle synchronous code", b: "To handle asynchronous operations more cleanly", c: "To create promises", d: "To manage events", correct: "b", marks: 1 },
      { q: "In React Router, what is the purpose of useNavigate hook?", a: "To create navigation menus", b: "To programmatically navigate between routes", c: "To handle authentication", d: "To manage state", correct: "b", marks: 1 },
      { q: "What is the purpose of connection pooling in MongoDB?", a: "To reuse database connections for better performance", b: "To backup data", c: "To handle authentication", d: "To create indexes", correct: "a", marks: 1 },
      { q: "What is the difference between useState and useRef?", a: "useState triggers re-render, useRef doesn't", b: "They are the same", c: "useRef is deprecated", d: "useState is for class components", correct: "a", marks: 1 },
      { q: "What is the purpose of bcrypt in authentication?", a: "To create JWT tokens", b: "To hash passwords securely", c: "To manage sessions", d: "To handle CORS", correct: "b", marks: 1 },
      { q: "In Express, what is the purpose of next() in middleware?", a: "To skip to the next route", b: "To pass control to the next middleware function", c: "To end the request", d: "To throw an error", correct: "b", marks: 1 },
      { q: "What is React Suspense used for?", a: "To handle authentication", b: "To handle loading states for lazy-loaded components", c: "To manage forms", d: "To create animations", correct: "b", marks: 1 },
      { q: "What is the purpose of environment variables in Node.js?", a: "To store configuration separately from code", b: "To improve performance", c: "To handle routing", d: "To manage dependencies", correct: "a", marks: 1 },
      { q: "What is the difference between PUT and PATCH HTTP methods?", a: "PUT updates entire resource, PATCH updates partially", b: "They are the same", c: "PUT is deprecated", d: "PATCH is faster", correct: "a", marks: 1 },
      { q: "What is the purpose of useCallback hook?", a: "To call APIs", b: "To memoize callback functions", c: "To handle events", d: "To manage state", correct: "b", marks: 1 },
      { q: "In MongoDB, what is a replica set?", a: "A group of mongod instances that maintain the same data set", b: "A backup tool", c: "An index type", d: "A query optimizer", correct: "a", marks: 1 },
      { q: "What is the purpose of React.StrictMode?", a: "To enforce strict typing", b: "To highlight potential problems in development", c: "To improve performance", d: "To handle errors", correct: "b", marks: 1 }
    ]
  },
  {
    title: "Java Full Stack Developer Assessment",
    description: "Comprehensive Java, Spring Boot, Hibernate, and frontend integration",
    duration: 60,
    questions: [
      { q: "What is the main purpose of Spring Boot?", a: "To create desktop applications", b: "To simplify Spring application development", c: "To replace Java", d: "To manage databases", correct: "b", marks: 1 },
      { q: "What is the difference between @Component, @Service, and @Repository?", a: "All are same, just semantic differences", b: "@Component is generic, @Service for business logic, @Repository for data access", c: "No difference", d: "@Component is deprecated", correct: "b", marks: 1 },
      { q: "What is JPA and how does it relate to Hibernate?", a: "JPA is specification, Hibernate is implementation", b: "JPA is older than Hibernate", c: "They are competitors", d: "Hibernate replaced JPA", correct: "a", marks: 1 },
      { q: "What is dependency injection in Spring?", a: "A design pattern where objects receive dependencies from external source", b: "A way to inject SQL queries", c: "A security feature", d: "A performance optimization", correct: "a", marks: 1 },
      { q: "What is the purpose of @Transactional annotation?", a: "To create database tables", b: "To manage database transactions declaratively", c: "To handle HTTP requests", d: "To create REST endpoints", correct: "b", marks: 1 },
      { q: "What is the difference between CrudRepository and JpaRepository?", a: "JpaRepository extends CrudRepository with additional methods", b: "They are the same", c: "CrudRepository is newer", d: "JpaRepository is deprecated", correct: "a", marks: 1 },
      { q: "What is the purpose of application.properties in Spring Boot?", a: "To store Java code", b: "To configure application settings", c: "To define HTML templates", d: "To manage dependencies", correct: "b", marks: 1 },
      { q: "What is RESTful API?", a: "A database type", b: "An architectural style for web services using HTTP methods", c: "A Java framework", d: "A security protocol", correct: "b", marks: 1 },
      { q: "What is the difference between @PathVariable and @RequestParam?", a: "@PathVariable extracts from URI path, @RequestParam from query string", b: "They are the same", c: "@PathVariable is deprecated", d: "@RequestParam is faster", correct: "a", marks: 1 },
      { q: "What is Spring Security used for?", a: "To secure database", b: "To provide authentication and authorization", c: "To encrypt files", d: "To manage sessions", correct: "b", marks: 1 },
      { q: "What is the N+1 query problem in Hibernate?", a: "A security issue", b: "Multiple queries executed instead of one, causing performance issues", c: "A compilation error", d: "A deprecated feature", correct: "b", marks: 1 },
      { q: "What is the purpose of @RestController?", a: "To create desktop GUIs", b: "To create RESTful web services combining @Controller and @ResponseBody", c: "To manage databases", d: "To handle security", correct: "b", marks: 1 },
      { q: "What is lazy loading in Hibernate?", a: "Slow application startup", b: "Loading related entities only when accessed", c: "A caching strategy", d: "A deprecated feature", correct: "b", marks: 1 },
      { q: "What is the difference between @Autowired and @Inject?", a: "@Autowired is Spring-specific, @Inject is JSR-330 standard", b: "They are exactly the same", c: "@Inject is deprecated", d: "@Autowired is slower", correct: "a", marks: 1 },
      { q: "What is Spring AOP used for?", a: "To create databases", b: "For aspect-oriented programming like logging, transactions", c: "To handle HTTP requests", d: "To create UI components", correct: "b", marks: 1 },
      { q: "What is the purpose of @Configuration annotation?", a: "To configure database", b: "To indicate a class provides Spring bean definitions", c: "To handle security", d: "To create REST endpoints", correct: "b", marks: 1 },
      { q: "What is the difference between List and Set in Java?", a: "List allows duplicates and maintains order, Set doesn't allow duplicates", b: "They are the same", c: "List is faster", d: "Set is deprecated", correct: "a", marks: 1 },
      { q: "What is a Lambda expression in Java?", a: "A database query", b: "A concise way to represent anonymous functions", c: "A security feature", d: "A deprecated syntax", correct: "b", marks: 1 },
      { q: "What is the purpose of Optional class in Java?", a: "To improve performance", b: "To handle null values explicitly and avoid NullPointerException", c: "To create collections", d: "To manage threads", correct: "b", marks: 1 },
      { q: "What is Spring Boot Actuator?", a: "A database tool", b: "Production-ready features for monitoring and managing applications", c: "A testing framework", d: "A UI library", correct: "b", marks: 1 },
      { q: "What is the difference between @OneToMany and @ManyToOne?", a: "Direction of the relationship in JPA entities", b: "They are the same", c: "Performance difference", d: "@OneToMany is deprecated", correct: "a", marks: 1 },
      { q: "What is a Stream in Java 8?", a: "A file I/O class", b: "A sequence of elements supporting sequential and parallel operations", c: "A network protocol", d: "A database connection", correct: "b", marks: 1 },
      { q: "What is the purpose of @SpringBootApplication?", a: "To create databases", b: "Convenience annotation combining @Configuration, @EnableAutoConfiguration, @ComponentScan", c: "To handle security", d: "To create REST APIs", correct: "b", marks: 1 },
      { q: "What is the difference between HashMap and ConcurrentHashMap?", a: "ConcurrentHashMap is thread-safe, HashMap is not", b: "They are the same", c: "HashMap is faster", d: "ConcurrentHashMap is deprecated", correct: "a", marks: 1 },
      { q: "What is JDBC and how does Spring simplify it?", a: "JDBC is Java Database Connectivity, Spring provides JdbcTemplate for easier usage", b: "JDBC is deprecated", c: "Spring doesn't use JDBC", d: "They are competitors", correct: "a", marks: 1 },
      { q: "What is the purpose of @Entity annotation?", a: "To create REST endpoints", b: "To mark a class as JPA entity mapped to database table", c: "To handle security", d: "To configure properties", correct: "b", marks: 1 },
      { q: "What is Exception Handling in Spring Boot?", a: "Using @ExceptionHandler, @ControllerAdvice for centralized error handling", b: "Not supported", c: "Only try-catch blocks", d: "Automatic without configuration", correct: "a", marks: 1 },
      { q: "What is the difference between ArrayList and LinkedList?", a: "ArrayList uses array, LinkedList uses doubly-linked nodes", b: "They are the same", c: "ArrayList is deprecated", d: "LinkedList is faster always", correct: "a", marks: 1 },
      { q: "What is Bean scope in Spring?", a: "Database scope", b: "Lifecycle of Spring beans: singleton, prototype, request, session, etc.", c: "Security scope", d: "Package visibility", correct: "b", marks: 1 },
      { q: "What is the purpose of Lombok in Spring Boot?", a: "To create databases", b: "To reduce boilerplate code with annotations for getters, setters, etc.", c: "To handle security", d: "To create REST APIs", correct: "b", marks: 1 }
    ]
  },
  {
    title: "Python Full Stack Developer Assessment",
    description: "Advanced Python, Django/Flask, REST APIs, and database integration",
    duration: 60,
    questions: [
      { q: "What is the difference between Django and Flask?", a: "Django is full-featured framework, Flask is lightweight microframework", b: "They are the same", c: "Flask is older", d: "Django is deprecated", correct: "a", marks: 1 },
      { q: "What is a decorator in Python?", a: "A design pattern", b: "A function that modifies behavior of another function", c: "A database tool", d: "A testing framework", correct: "b", marks: 1 },
      { q: "What is the purpose of virtual environment in Python?", a: "To run multiple Python versions", b: "To isolate project dependencies", c: "To improve performance", d: "To handle errors", correct: "b", marks: 1 },
      { q: "What is the difference between list and tuple in Python?", a: "Lists are mutable, tuples are immutable", b: "They are the same", c: "Tuples are faster always", d: "Lists are deprecated", correct: "a", marks: 1 },
      { q: "What is Django ORM?", a: "A testing tool", b: "Object-Relational Mapping for database operations", c: "A security feature", d: "A UI framework", correct: "b", marks: 1 },
      { q: "What is the purpose of requirements.txt?", a: "To document code", b: "To list project dependencies", c: "To configure database", d: "To define routes", correct: "b", marks: 1 },
      { q: "What is the difference between @staticmethod and @classmethod?", a: "@staticmethod doesn't receive implicit first argument, @classmethod receives class", b: "They are the same", c: "@staticmethod is deprecated", d: "No difference", correct: "a", marks: 1 },
      { q: "What is middleware in Django?", a: "Database layer", b: "Component that processes requests/responses globally", c: "Testing tool", d: "Security feature only", correct: "b", marks: 1 },
      { q: "What is the purpose of __init__.py?", a: "To initialize database", b: "To make directory a Python package", c: "To define routes", d: "To handle errors", correct: "b", marks: 1 },
      { q: "What is Flask-RESTful used for?", a: "To create desktop apps", b: "To quickly build REST APIs in Flask", c: "To manage databases", d: "To handle authentication only", correct: "b", marks: 1 },
      { q: "What is the difference between SQLAlchemy and Django ORM?", a: "SQLAlchemy is standalone ORM, Django ORM is Django-specific", b: "They are the same", c: "SQLAlchemy is deprecated", d: "Django ORM is faster always", correct: "a", marks: 1 },
      { q: "What is a generator in Python?", a: "A function that returns iterator using yield", b: "A testing tool", c: "A database manager", d: "A security feature", correct: "a", marks: 1 },
      { q: "What is the purpose of Django migrations?", a: "To move files", b: "To propagate model changes to database schema", c: "To deploy applications", d: "To test code", correct: "b", marks: 1 },
      { q: "What is the difference between == and is in Python?", a: "== compares values, is compares object identity", b: "They are the same", c: "is is deprecated", d: "== is faster", correct: "a", marks: 1 },
      { q: "What is WSGI?", a: "A database protocol", b: "Web Server Gateway Interface, standard interface between web servers and Python apps", c: "A testing framework", d: "A security protocol", correct: "b", marks: 1 },
      { q: "What is the purpose of context processors in Django?", a: "To process images", b: "To add variables to template context globally", c: "To handle authentication", d: "To manage databases", correct: "b", marks: 1 },
      { q: "What is list comprehension in Python?", a: "A loop type", b: "Concise way to create lists using single line of code", c: "A function decorator", d: "A testing method", correct: "b", marks: 1 },
      { q: "What is the purpose of pip?", a: "Python package installer", b: "Python interpreter", c: "Python compiler", d: "Python debugger", correct: "a", marks: 1 },
      { q: "What is Django REST Framework?", a: "A database tool", b: "Powerful toolkit for building Web APIs in Django", c: "A testing framework", d: "A deployment tool", correct: "b", marks: 1 },
      { q: "What is the difference between args and kwargs?", a: "*args for variable positional arguments, **kwargs for keyword arguments", b: "They are the same", c: "args is deprecated", d: "kwargs is faster", correct: "a", marks: 1 },
      { q: "What is celery used for in Python?", a: "To create UIs", b: "For distributed task queue/asynchronous job processing", c: "To manage databases", d: "To handle routing", correct: "b", marks: 1 },
      { q: "What is the purpose of serializers in Django REST Framework?", a: "To serialize objects", b: "To convert complex data types to Python datatypes and vice versa", c: "To handle authentication", d: "To create models", correct: "b", marks: 1 },
      { q: "What is the difference between deep copy and shallow copy?", a: "Deep copy copies nested objects, shallow copy doesn't", b: "They are the same", c: "Deep copy is deprecated", d: "Shallow copy is faster always", correct: "a", marks: 1 },
      { q: "What is the purpose of Django signals?", a: "To send emails", b: "To allow decoupled applications to get notified when actions occur", c: "To handle routing", d: "To manage databases", correct: "b", marks: 1 },
      { q: "What is asyncio in Python?", a: "A database library", b: "Library for writing asynchronous code using async/await", c: "A testing framework", d: "A security tool", correct: "b", marks: 1 },
      { q: "What is the purpose of Flask blueprints?", a: "To create databases", b: "To organize application into modules/components", c: "To handle security", d: "To manage dependencies", correct: "b", marks: 1 },
      { q: "What is the GIL in Python?", a: "Global Interpreter Lock, prevents multiple threads from executing Python bytecode simultaneously", b: "Graphics Interface Library", c: "General Input Library", d: "Global Index List", correct: "a", marks: 1 },
      { q: "What is the purpose of pytest?", a: "To test Python code with simple and scalable framework", b: "To deploy applications", c: "To manage databases", d: "To create UIs", correct: "a", marks: 1 },
      { q: "What is the difference between Django templates and Jinja2?", a: "Django templates are Django-specific, Jinja2 is standalone and more powerful", b: "They are the same", c: "Django templates are deprecated", d: "Jinja2 is Django-only", correct: "a", marks: 1 },
      { q: "What is the purpose of Redis with Python applications?", a: "To replace databases", b: "For caching, session storage, and message brokering", c: "To handle routing", d: "To create UIs", correct: "b", marks: 1 }
    ]
  },
  {
    title: "Software Testing & QA Assessment",
    description: "Comprehensive software testing methodologies, automation, and quality assurance",
    duration: 60,
    questions: [
      { q: "What is the difference between verification and validation?", a: "Verification checks if product is built right, validation checks if right product is built", b: "They are the same", c: "Verification is deprecated", d: "Validation is newer", correct: "a", marks: 1 },
      { q: "What is black box testing?", a: "Testing without knowing internal code structure", b: "Testing in dark room", c: "Testing security only", d: "Testing deprecated features", correct: "a", marks: 1 },
      { q: "What is the difference between smoke testing and sanity testing?", a: "Smoke testing checks basic functionality, sanity testing checks specific functionality after changes", b: "They are the same", c: "Smoke testing is deprecated", d: "Sanity testing is slower", correct: "a", marks: 1 },
      { q: "What is regression testing?", a: "Testing new features only", b: "Re-testing to ensure existing functionality works after changes", c: "Testing performance", d: "Testing security", correct: "b", marks: 1 },
      { q: "What is the purpose of Selenium WebDriver?", a: "To test databases", b: "To automate web browser testing", c: "To test APIs", d: "To test mobile apps", correct: "b", marks: 1 },
      { q: "What is test-driven development (TDD)?", a: "Testing after development", b: "Writing tests before writing code", c: "Testing without documentation", d: "Testing by users only", correct: "b", marks: 1 },
      { q: "What is the difference between unit testing and integration testing?", a: "Unit tests individual components, integration tests component interactions", b: "They are the same", c: "Unit testing is deprecated", d: "Integration testing is faster", correct: "a", marks: 1 },
      { q: "What is boundary value analysis?", a: "Testing network boundaries", b: "Testing at boundaries of input ranges", c: "Testing database limits", d: "Testing memory limits only", correct: "b", marks: 1 },
      { q: "What is the purpose of JUnit?", a: "To test databases", b: "Java testing framework for unit testing", c: "To test UIs only", d: "To test networks", correct: "b", marks: 1 },
      { q: "What is mocking in testing?", a: "Making fun of code", b: "Creating fake objects to simulate real object behavior", c: "Testing slowly", d: "Testing without data", correct: "b", marks: 1 },
      { q: "What is load testing?", a: "Testing how application loads", b: "Testing system behavior under expected load", c: "Testing installation", d: "Testing security", correct: "b", marks: 1 },
      { q: "What is the difference between functional and non-functional testing?", a: "Functional tests features, non-functional tests quality attributes like performance", b: "They are the same", c: "Functional is deprecated", d: "Non-functional is optional", correct: "a", marks: 1 },
      { q: "What is continuous integration in testing?", a: "Testing once", b: "Frequently integrating code changes and running automated tests", c: "Manual testing only", d: "Testing in production", correct: "b", marks: 1 },
      { q: "What is code coverage?", a: "Amount of comments in code", b: "Percentage of code executed during tests", c: "Number of test cases", d: "Time taken to test", correct: "b", marks: 1 },
      { q: "What is the purpose of Postman in testing?", a: "To send emails", b: "To test APIs", c: "To test databases", d: "To test UIs", correct: "b", marks: 1 },
      { q: "What is exploratory testing?", a: "Testing without planning", b: "Simultaneous learning, test design, and execution", c: "Testing by exploring building", d: "Automated testing only", correct: "b", marks: 1 },
      { q: "What is the difference between alpha and beta testing?", a: "Alpha by internal team, beta by external users", b: "They are the same", c: "Alpha is automated", d: "Beta is deprecated", correct: "a", marks: 1 },
      { q: "What is mutation testing?", a: "Testing mutations in UI", b: "Modifying code to check if tests detect changes", c: "Testing database changes", d: "Testing network changes", correct: "b", marks: 1 },
      { q: "What is the purpose of test automation frameworks?", a: "To make testing slower", b: "To provide structure and tools for automated testing", c: "To replace manual testing completely", d: "To test automation tools", correct: "b", marks: 1 },
      { q: "What is equivalence partitioning?", a: "Dividing hard drive", b: "Dividing input data into equivalent partitions for testing", c: "Dividing team members", d: "Dividing test cases randomly", correct: "b", marks: 1 },
      { q: "What is the purpose of TestNG?", a: "To test networks", b: "Java testing framework inspired by JUnit with more features", c: "To test graphics", d: "To test databases only", correct: "b", marks: 1 },
      { q: "What is performance testing?", a: "Testing how fast developers work", b: "Testing application's speed, scalability, and stability", c: "Testing team performance", d: "Testing manually only", correct: "b", marks: 1 },
      { q: "What is the difference between defect and failure?", a: "Defect is flaw in code, failure is system not performing expected function", b: "They are the same", c: "Defect is worse", d: "Failure is acceptable", correct: "a", marks: 1 },
      { q: "What is acceptance testing?", a: "Testing if developers accept code", b: "Testing if system meets business requirements", c: "Testing randomly", d: "Testing automatically", correct: "b", marks: 1 },
      { q: "What is the purpose of Cypress?", a: "To test trees", b: "Modern web testing framework", c: "To test databases", d: "To test mobile apps", correct: "b", marks: 1 },
      { q: "What is static testing?", a: "Testing without executing code (reviews, walkthroughs)", b: "Testing with fixed data", c: "Testing that never changes", d: "Testing deprecated code", correct: "a", marks: 1 },
      { q: "What is the test pyramid?", a: "Ancient testing method", b: "Visual guide showing different test levels: many unit tests, fewer integration, fewest UI tests", c: "Building where testers work", d: "Deprecated testing model", correct: "b", marks: 1 },
      { q: "What is API testing?", a: "Testing how APIs look", b: "Testing API functionality, reliability, performance, and security", c: "Testing API documentation", d: "Testing API names", correct: "b", marks: 1 },
      { q: "What is the purpose of JMeter?", a: "To measure code lines", b: "For load testing and performance testing", c: "To test Java only", d: "To test meters", correct: "b", marks: 1 },
      { q: "What is shift-left testing?", a: "Testing on left monitor", b: "Testing earlier in development lifecycle", c: "Testing by left-handed people", d: "Testing deprecated features", correct: "b", marks: 1 }
    ]
  },
  {
    title: "DevOps & Cloud Engineering Assessment",
    description: "Advanced DevOps practices, CI/CD, containerization, and cloud platforms",
    duration: 60,
    questions: [
      { q: "What is the primary purpose of Docker?", a: "To create virtual machines", b: "To containerize applications for consistent deployment", c: "To replace programming languages", d: "To manage databases", correct: "b", marks: 1 },
      { q: "What is the difference between Docker image and container?", a: "Image is template, container is running instance", b: "They are the same", c: "Image is deprecated", d: "Container is slower", correct: "a", marks: 1 },
      { q: "What is Kubernetes used for?", a: "To write code", b: "Container orchestration and management", c: "To create databases", d: "To test applications", correct: "b", marks: 1 },
      { q: "What is CI/CD?", a: "Continuous Integration/Continuous Deployment", b: "Code Integration/Code Deployment", c: "Cloud Integration/Cloud Deployment", d: "Container Integration/Container Deployment", correct: "a", marks: 1 },
      { q: "What is the purpose of Jenkins?", a: "To write code", b: "For automation server enabling CI/CD", c: "To manage databases", d: "To create UIs", correct: "b", marks: 1 },
      { q: "What is Infrastructure as Code (IaC)?", a: "Writing code for infrastructure", b: "Managing infrastructure through code/definition files", c: "Building infrastructure manually", d: "Deprecated practice", correct: "b", marks: 1 },
      { q: "What is the difference between Ansible and Terraform?", a: "Ansible for configuration management, Terraform for infrastructure provisioning", b: "They are the same", c: "Ansible is deprecated", d: "Terraform is slower", correct: "a", marks: 1 },
      { q: "What is a Docker Compose file used for?", a: "To compose music", b: "To define and run multi-container Docker applications", c: "To write code", d: "To test applications", correct: "b", marks: 1 },
      { q: "What is the purpose of kubectl?", a: "To control databases", b: "Command-line tool for Kubernetes cluster management", c: "To write code", d: "To test applications", correct: "b", marks: 1 },
      { q: "What is a Kubernetes pod?", a: "A database", b: "Smallest deployable unit containing one or more containers", c: "A network protocol", d: "A testing tool", correct: "b", marks: 1 },
      { q: "What is the purpose of Git in DevOps?", a: "To deploy applications", b: "For version control and collaboration", c: "To test code", d: "To monitor systems", correct: "b", marks: 1 },
      { q: "What is blue-green deployment?", a: "Deployment with colored servers", b: "Running two identical production environments for zero-downtime deployment", c: "Deployment on Mondays only", d: "Deprecated strategy", correct: "b", marks: 1 },
      { q: "What is Prometheus used for?", a: "To write code", b: "For monitoring and alerting", c: "To manage databases", d: "To test applications", correct: "b", marks: 1 },
      { q: "What is the difference between horizontal and vertical scaling?", a: "Horizontal adds more instances, vertical increases instance resources", b: "They are the same", c: "Horizontal is deprecated", d: "Vertical is always better", correct: "a", marks: 1 },
      { q: "What is Grafana used for?", a: "To write code", b: "For data visualization and monitoring dashboards", c: "To manage containers", d: "To test applications", correct: "b", marks: 1 },
      { q: "What is a Dockerfile?", a: "Documentation file", b: "Text file with instructions to build Docker image", c: "Configuration file for Docker Compose", d: "Deprecated file type", correct: "b", marks: 1 },
      { q: "What is the purpose of Nginx in DevOps?", a: "To write code", b: "As web server, reverse proxy, and load balancer", c: "To manage databases", d: "To test applications", correct: "b", marks: 1 },
      { q: "What is a microservices architecture?", a: "Small code files", b: "Architectural style where application is collection of loosely coupled services", c: "Deprecated architecture", d: "Architecture for small apps only", correct: "b", marks: 1 },
      { q: "What is the purpose of AWS EC2?", a: "To write code", b: "To provide scalable virtual servers in cloud", c: "To manage local databases", d: "To test applications only", correct: "b", marks: 1 },
      { q: "What is Helm in Kubernetes?", a: "A steering wheel", b: "Package manager for Kubernetes", c: "A monitoring tool", d: "A testing framework", correct: "b", marks: 1 },
      { q: "What is the purpose of Docker Registry?", a: "To register users", b: "To store and distribute Docker images", c: "To monitor containers", d: "To test images", correct: "b", marks: 1 },
      { q: "What is continuous monitoring in DevOps?", a: "Watching developers work", b: "Ongoing monitoring of application and infrastructure health", c: "Monitoring once a day", d: "Deprecated practice", correct: "b", marks: 1 },
      { q: "What is the difference between Docker Swarm and Kubernetes?", a: "Both are container orchestration tools, Kubernetes is more feature-rich", b: "They are the same", c: "Docker Swarm is deprecated", d: "Kubernetes is simpler", correct: "a", marks: 1 },
      { q: "What is GitOps?", a: "Git operations", b: "Using Git as single source of truth for declarative infrastructure and applications", c: "Git optimization", d: "Deprecated practice", correct: "b", marks: 1 },
      { q: "What is the purpose of Redis in DevOps?", a: "To replace databases", b: "For caching and session storage", c: "To write code", d: "To test applications", correct: "b", marks: 1 },
      { q: "What is a Kubernetes service?", a: "A maintenance service", b: "Abstract way to expose application running on pods", c: "A testing service", d: "A deprecated feature", correct: "b", marks: 1 },
      { q: "What is the purpose of AWS S3?", a: "To run servers", b: "For object storage in cloud", c: "To write code", d: "To test applications", correct: "b", marks: 1 },
      { q: "What is logging aggregation?", a: "Adding log files", b: "Collecting logs from multiple sources into centralized system", c: "Deleting old logs", d: "Deprecated practice", correct: "b", marks: 1 },
      { q: "What is the purpose of Elasticsearch in DevOps?", a: "To search code", b: "For log analytics and full-text search", c: "To manage containers", d: "To test applications", correct: "b", marks: 1 },
      { q: "What is canary deployment?", a: "Deployment with birds", b: "Gradually rolling out changes to small subset of users before full deployment", c: "Deployment on weekends", d: "Deprecated strategy", correct: "b", marks: 1 }
    ]
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    db.serialize(() => {
      // Insert admin user
      db.run(
        'INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [1, 'admin', 'admin@assessment.com', hashedPassword, 'admin'],
        (err) => {
          if (err) {
            console.log('Admin user already exists or error:', err.message);
          } else {
            console.log('✅ Admin user created (email: admin@assessment.com, password: admin123)');
          }
        }
      );

      // Insert exams
      examsData.forEach((exam, examIndex) => {
        db.run(
          'INSERT INTO exams (title, description, duration, total_marks, created_by) VALUES (?, ?, ?, ?, ?)',
          [exam.title, exam.description, exam.duration, exam.questions.length, 1],
          function(err) {
            if (err) {
              console.log(`❌ Error creating exam "${exam.title}":`, err.message);
              return;
            }

            const examId = this.lastID;
            console.log(`✅ Created exam: ${exam.title}`);

            // Insert questions for this exam
            const stmt = db.prepare(
              'INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );

            exam.questions.forEach((question, qIndex) => {
              stmt.run([
                examId,
                question.q,
                question.a,
                question.b,
                question.c,
                question.d,
                question.correct,
                question.marks
              ], (err) => {
                if (err) {
                  console.log(`  ❌ Error adding question ${qIndex + 1}:`, err.message);
                }
              });
            });

            stmt.finalize(() => {
              console.log(`  ✅ Added ${exam.questions.length} questions to "${exam.title}"\n`);
              
              // Close database after last exam
              if (examIndex === examsData.length - 1) {
                setTimeout(() => {
                  db.close((err) => {
                    if (err) {
                      console.error('Error closing database:', err.message);
                    } else {
                      console.log('\n🎉 Database seeding completed successfully!');
                      console.log('\n📝 Summary:');
                      console.log('   - 5 comprehensive exams created');
                      console.log('   - 150 total questions added');
                      console.log('   - Admin account: admin@assessment.com / admin123');
                      console.log('\n🚀 Start the application and login to see the exams!');
                    }
                    process.exit(0);
                  });
                }, 1000);
              }
            });
          }
        );
      });
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();

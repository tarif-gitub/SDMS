CREATE TABLE App_User (
    User_ID SERIAL PRIMARY KEY,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(50),
    Account_status VARCHAR(20),
    Last_login TIMESTAMP
);

CREATE TABLE Department (
    Dept_ID SERIAL PRIMARY KEY,
    Dept_Name VARCHAR(100) NOT NULL
);


CREATE TABLE Admin_Detail (
    User_ID INT PRIMARY KEY REFERENCES App_User(User_ID),
    Name VARCHAR(100),
    Room_No VARCHAR(20)
);

CREATE TABLE Teacher_Core (
    User_ID INT PRIMARY KEY REFERENCES App_User(User_ID),
    Name VARCHAR(100),
    Designation VARCHAR(50),
    Dept_ID INT REFERENCES Department(Dept_ID)
);

CREATE TABLE Course_Master (
    Course_ID SERIAL PRIMARY KEY,
    Title VARCHAR(200),
    Credit_Hours DECIMAL(3, 1),
    Type VARCHAR(50),
    Target_Level INT,
    Target_Term INT,
    Dept_ID INT REFERENCES Department(Dept_ID)
);


CREATE TABLE Student_Core (
    User_ID INT PRIMARY KEY REFERENCES App_User(User_ID),
    Name VARCHAR(100),
    Hall_Name VARCHAR(100),
    Total_credit_earned DECIMAL(5, 2) DEFAULT 0.0,
    Dept_ID INT REFERENCES Department(Dept_ID),
    Advisor_ID INT REFERENCES Teacher_Core(User_ID)
);

CREATE TABLE Teacher_Profile (
    User_ID INT PRIMARY KEY REFERENCES Teacher_Core(User_ID),
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Room_No VARCHAR(20),
    Research_Interest TEXT
);

CREATE TABLE Semester (
    Semester_ID SERIAL PRIMARY KEY,
    Start_Date DATE,
    End_Date DATE,
    Reg_start_Date DATE,
    Reg_deadline DATE,
    Drop_Deadline DATE,
    Admin_ID INT REFERENCES Admin_Detail(User_ID)
);

CREATE TABLE Student_Profile (
    User_ID INT PRIMARY KEY REFERENCES Student_Core(User_ID),
    Profile_picture TEXT,
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Date_Of_Birth DATE,
    Blood_Group VARCHAR(5),
    Address TEXT
);

CREATE TABLE Fee (
    Fee_ID SERIAL PRIMARY KEY,
    Fee_Title VARCHAR(100),
    Semester_id INT REFERENCES Semester(Semester_ID),
    Amount DECIMAL(10, 2)
);

CREATE TABLE Course_Section (
    Course_ID INT REFERENCES Course_Master(Course_ID),
    Section_ID INT,
    Section_Name VARCHAR(50),
    Semester_ID INT REFERENCES Semester(Semester_ID),
    PRIMARY KEY (Course_ID, Section_ID)
);

CREATE TABLE Teaches (
    Teacher_ID INT REFERENCES Teacher_Core(User_ID),
    Course_ID INT,
    Section_ID INT,
    PRIMARY KEY (Teacher_ID, Course_ID, Section_ID),
    FOREIGN KEY (Course_ID, Section_ID) REFERENCES Course_Section(Course_ID, Section_ID)
);

CREATE TABLE Enrolls (
    User_ID INT REFERENCES Student_Core(User_ID),
    Course_ID INT,
    Section_ID INT,
    PRIMARY KEY (User_ID, Course_ID, Section_ID),
    FOREIGN KEY (Course_ID, Section_ID) REFERENCES Course_Section(Course_ID, Section_ID)
);

CREATE TABLE Result (
    User_ID INT REFERENCES Student_Core(User_ID),
    Course_ID INT,
    Section_ID INT,
    Obtained_marks DECIMAL(5, 2),
    Grade_points DECIMAL(3, 2),
    Attendance_percent DECIMAL(5, 2),
    PRIMARY KEY (User_ID, Course_ID, Section_ID),
    FOREIGN KEY (Course_ID, Section_ID) REFERENCES Course_Section(Course_ID, Section_ID)
);

CREATE TABLE Student_Payment (
    User_ID INT REFERENCES Student_Core(User_ID),
    Payment_ID SERIAL,
    Payment_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Amount_paid DECIMAL(10, 2),
    Due DECIMAL(10, 2),
    Status VARCHAR(20),
    Fee_ID INT REFERENCES Fee(Fee_ID),
    PRIMARY KEY (User_ID, Payment_ID)
);
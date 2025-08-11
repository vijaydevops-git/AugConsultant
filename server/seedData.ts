import { db } from "./db";
import { consultants, vendors, submissions, interviews, users } from "@shared/schema";

export async function seedDatabase() {
  try {
    // Check if data already exists
    const existingConsultants = await db.select().from(consultants).limit(1);
    if (existingConsultants.length > 0) {
      console.log("Database already seeded");
      return;
    }

    console.log("Seeding database with demo data...");
    
    // Get the first user in the system to use as creator
    const existingUsers = await db.select().from(users).limit(1);
    const createdBy = existingUsers[0]?.id || "system";

    // Seed consultants
    const createdConsultants = await db.insert(consultants).values([
      {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@email.com",
        phone: "+1-555-0101",
        position: "Senior Java Developer",
        skills: ["Java", "Spring Boot", "Microservices", "AWS"],
        experience: "8 years",
        location: "New York, NY",
        status: "active",
        resumeUrl: "/uploads/john-smith-resume.pdf",
        resumeFileName: "john-smith-resume.pdf",
        createdBy: createdBy
      },
      {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@email.com",
        phone: "+1-555-0102",
        position: "React Frontend Developer",
        skills: ["React", "TypeScript", "Node.js", "GraphQL"],
        experience: "5 years",
        location: "San Francisco, CA",
        status: "active",
        resumeUrl: "/uploads/sarah-johnson-resume.pdf",
        resumeFileName: "sarah-johnson-resume.pdf",
        createdBy: createdBy
      },
      {
        firstName: "Michael",
        lastName: "Chen",
        email: "michael.chen@email.com",
        phone: "+1-555-0103",
        position: "DevOps Engineer",
        skills: ["Docker", "Kubernetes", "AWS", "Terraform"],
        experience: "6 years",
        location: "Seattle, WA",
        status: "placed",
        resumeUrl: "/uploads/michael-chen-resume.pdf",
        resumeFileName: "michael-chen-resume.pdf",
        createdBy: createdBy
      },
      {
        firstName: "Emily",
        lastName: "Davis",
        email: "emily.davis@email.com",
        phone: "+1-555-0104",
        position: "Python Data Scientist",
        skills: ["Python", "Machine Learning", "TensorFlow", "SQL"],
        experience: "4 years",
        location: "Boston, MA",
        status: "active",
        resumeUrl: "/uploads/emily-davis-resume.pdf",
        resumeFileName: "emily-davis-resume.pdf",
        createdBy: createdBy
      }
    ]).returning();

    // Seed vendors
    const createdVendors = await db.insert(vendors).values([
      {
        name: "TechCorp Solutions",
        contactPerson: "Robert Wilson",
        email: "robert.wilson@techcorp.com",
        phone: "+1-555-1001",
        location: "New York, NY",
        specialties: ["Java", "Spring Boot", "Microservices"],
        status: "active",
        notes: "Leading technology consulting firm",
        createdBy: createdBy
      },
      {
        name: "InnovateTech Inc",
        contactPerson: "Lisa Anderson",
        email: "lisa.anderson@innovatetech.com",
        phone: "+1-555-1002",
        location: "San Francisco, CA",
        specialties: ["React", "AI", "Machine Learning"],
        status: "active",
        notes: "Startup focused on AI and machine learning",
        createdBy: createdBy
      },
      {
        name: "CloudFirst Systems",
        contactPerson: "David Brown",
        email: "david.brown@cloudfirst.com",
        phone: "+1-555-1003",
        location: "Seattle, WA",
        specialties: ["DevOps", "AWS", "Docker", "Kubernetes"],
        status: "active",
        notes: "Cloud infrastructure and DevOps specialists",
        createdBy: createdBy
      },
      {
        name: "DataDriven Analytics",
        contactPerson: "Jennifer Taylor",
        email: "jennifer.taylor@datadriven.com",
        phone: "+1-555-1004",
        location: "Boston, MA",
        specialties: ["Python", "Data Analytics", "SQL"],
        status: "pending",
        notes: "Data analytics and business intelligence",
        createdBy: createdBy
      }
    ]).returning();

    // Seed submissions
    const createdSubmissions = await db.insert(submissions).values([
      {
        consultantId: createdConsultants[0].id,
        vendorId: createdVendors[0].id,
        positionTitle: "Senior Java Developer",
        status: "submitted",
        submissionDate: new Date("2024-01-15"),
        notes: "Great fit for their microservices project",
        createdBy: createdBy
      },
      {
        consultantId: createdConsultants[1].id,
        vendorId: createdVendors[1].id,
        positionTitle: "Frontend React Developer",
        status: "under_review",
        submissionDate: new Date("2024-01-18"),
        notes: "Awaiting technical interview feedback",
        createdBy: createdBy
      },
      {
        consultantId: createdConsultants[2].id,
        vendorId: createdVendors[2].id,
        positionTitle: "DevOps Engineer",
        status: "interview_scheduled",
        submissionDate: new Date("2024-01-20"),
        notes: "Technical interview scheduled for next week",
        createdBy: createdBy
      },
      {
        consultantId: createdConsultants[3].id,
        vendorId: createdVendors[3].id,
        positionTitle: "Data Scientist",
        status: "submitted",
        submissionDate: new Date("2024-01-22"),
        notes: "Resume submitted, pending initial review",
        createdBy: createdBy
      }
    ]).returning();

    // Seed interviews
    await db.insert(interviews).values([
      {
        submissionId: createdSubmissions[2].id,
        interviewDate: new Date("2024-01-28T10:00:00"),
        interviewType: "video",
        roundType: "technical",
        status: "scheduled",
        notes: "Technical interview focusing on Kubernetes and AWS",
        createdBy: createdBy
      },
      {
        submissionId: createdSubmissions[1].id,
        interviewDate: new Date("2024-01-25T14:00:00"),
        interviewType: "video", 
        roundType: "technical",
        status: "completed",
        notes: "Candidate performed well in coding challenge - Strong technical skills, good React knowledge",
        createdBy: createdBy
      }
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
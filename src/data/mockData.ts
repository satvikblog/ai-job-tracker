import { JobApplication, Document, FollowUp, Statistics } from '../types';

export const mockJobApplications: JobApplication[] = [
  {
    id: '1',
    companyName: 'Google',
    jobTitle: 'Senior Software Engineer',
    jobLink: 'https://careers.google.com/jobs/results/123456789',
    sourceSite: 'Google Careers',
    appliedOn: '2024-01-15',
    status: 'interview',
    nextFollowUpDate: '2024-01-25',
    notes: 'Passed initial screening. Technical interview scheduled.',
    salary: '$180,000 - $220,000',
    location: 'Mountain View, CA',
    contactDetails: {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@google.com',
      linkedin: 'linkedin.com/in/sarahjohnson'
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    companyName: 'Microsoft',
    jobTitle: 'Principal Product Manager',
    jobLink: 'https://careers.microsoft.com/us/en/job/1234567',
    sourceSite: 'Microsoft Careers',
    appliedOn: '2024-01-12',
    status: 'followed-up',
    nextFollowUpDate: '2024-01-22',
    notes: 'Sent follow-up email. Waiting for response.',
    salary: '$160,000 - $200,000',
    location: 'Seattle, WA',
    contactDetails: {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@microsoft.com'
    },
    createdAt: '2024-01-12T09:15:00Z',
    updatedAt: '2024-01-18T11:45:00Z'
  },
  {
    id: '3',
    companyName: 'Amazon',
    jobTitle: 'Senior Frontend Developer',
    sourceSite: 'LinkedIn',
    appliedOn: '2024-01-10',
    status: 'applied',
    salary: '$140,000 - $180,000',
    location: 'Austin, TX',
    notes: 'Applied through LinkedIn. Strong match for role requirements.',
    createdAt: '2024-01-10T16:20:00Z',
    updatedAt: '2024-01-10T16:20:00Z'
  },
  {
    id: '4',
    companyName: 'Tesla',
    jobTitle: 'Software Engineer - Autopilot',
    sourceSite: 'Tesla Careers',
    appliedOn: '2024-01-08',
    status: 'rejected',
    notes: 'Not selected for this position. Feedback: Need more ML experience.',
    salary: '$150,000 - $190,000',
    location: 'Palo Alto, CA',
    createdAt: '2024-01-08T13:30:00Z',
    updatedAt: '2024-01-16T10:00:00Z'
  },
  {
    id: '5',
    companyName: 'Stripe',
    jobTitle: 'Full Stack Engineer',
    sourceSite: 'AngelList',
    appliedOn: '2024-01-05',
    status: 'no-response',
    nextFollowUpDate: '2024-01-23',
    salary: '$160,000 - $200,000',
    location: 'San Francisco, CA',
    notes: 'No response yet. Plan to follow up soon.',
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-05T11:00:00Z'
  },
  {
    id: '6',
    companyName: 'Airbnb',
    jobTitle: 'Senior React Developer',
    sourceSite: 'Company Website',
    appliedOn: '2024-01-03',
    status: 'offer',
    salary: '$170,000 - $210,000',
    location: 'San Francisco, CA',
    notes: 'Received offer! Negotiating compensation package.',
    contactDetails: {
      id: '6',
      name: 'Lisa Wong',
      email: 'lisa.wong@airbnb.com',
      linkedin: 'linkedin.com/in/lisawong'
    },
    createdAt: '2024-01-03T14:45:00Z',
    updatedAt: '2024-01-20T09:30:00Z'
  }
];

export const mockDocuments: Document[] = [
  {
    id: '1',
    fileName: 'John_Doe_Resume_2024.pdf',
    fileType: 'resume',
    fileUrl: '/documents/resume.pdf',
    uploadedOn: '2024-01-01',
    size: 245000,
    linkedJobId: '1'
  },
  {
    id: '2',
    fileName: 'Cover_Letter_Google.pdf',
    fileType: 'cover-letter',
    fileUrl: '/documents/cover-letter-google.pdf',
    uploadedOn: '2024-01-15',
    size: 128000,
    linkedJobId: '1'
  },
  {
    id: '3',
    fileName: 'AWS_Certificate.pdf',
    fileType: 'certificate',
    fileUrl: '/documents/aws-cert.pdf',
    uploadedOn: '2023-12-15',
    size: 512000
  }
];

export const mockFollowUps: FollowUp[] = [
  {
    id: '1',
    jobId: '2',
    date: '2024-01-18',
    emailText: 'Hi Michael, I wanted to follow up on my application for the Principal Product Manager position. I\'m very excited about the opportunity to contribute to Microsoft\'s product strategy.',
    responseStatus: 'no-reply',
    notes: 'First follow-up sent'
  },
  {
    id: '2',
    jobId: '1',
    date: '2024-01-16',
    emailText: 'Thank you for the interview yesterday. I\'m excited about the next steps in the process.',
    responseStatus: 'positive',
    notes: 'Received positive response - moving to next round'
  }
];

export const mockStatistics: Statistics = {
  totalApplications: 6,
  statusBreakdown: {
    'applied': 1,
    'followed-up': 1,
    'rejected': 1,
    'no-response': 1,
    'offer': 1,
    'interview': 1
  },
  followUpsPending: 2,
  offersReceived: 1,
  averageResponseTime: 7.5,
  monthlyApplications: [
    { month: 'Nov', count: 2 },
    { month: 'Dec', count: 4 },
    { month: 'Jan', count: 6 }
  ]
};
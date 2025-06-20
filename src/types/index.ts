export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  jobLink?: string;
  sourceSite: string;
  appliedOn: string;
  status: 'applied' | 'followed-up' | 'rejected' | 'no-response' | 'offer' | 'interview';
  nextFollowUpDate?: string;
  notes?: string;
  salary?: string;
  location?: string;
  contactDetails?: Contact;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  linkedin?: string;
  phone?: string;
  notes?: string;
}

export interface Document {
  id: string;
  fileName: string;
  fileType: 'resume' | 'cover-letter' | 'certificate' | 'other';
  fileUrl: string;
  uploadedOn: string;
  size: number;
  linkedJobId?: string;
}

export interface FollowUp {
  id: string;
  jobId: string;
  date: string;
  emailText: string;
  responseStatus: 'positive' | 'negative' | 'no-reply' | 'pending';
  notes?: string;
}

export interface AIGeneration {
  id: string;
  jobId: string;
  type: 'resume' | 'cover-letter';
  content: string;
  generatedOn: string;
  isUsed: boolean;
}

export interface Statistics {
  totalApplications: number;
  statusBreakdown: Record<JobApplication['status'], number>;
  followUpsPending: number;
  offersReceived: number;
  averageResponseTime: number;
  monthlyApplications: { month: string; count: number }[];
}
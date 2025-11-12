export type OpportunityStatus = "open" | "in_progress" | "closed";

export type OpportunityStatusLabel = "募集中" | "募集済み" | "完了済み";

export type OpportunityManager = {
  id: string;
  name: string;
  role: string;
  sharePercentage: number;
  avatarUrl: string;
  tagline: string;
};

export type OpportunityOwner = {
  id: string;
  name: string;
  avatarUrl: string;
  tagline: string;
};

export type Opportunity = {
  id: string;
  title: string;
  farmName: string;
  description: string;
  tags: string[];
  interestTags: string[];
  workstyleTags: string[];
  farmTypes: string[];
  rewardMiles: number;
  status: OpportunityStatus;
  startDate: string;
  endDate: string;
  location: {
    prefecture: string;
    city: string;
    address: string;
    lat: number;
    lng: number;
  };
  capacity: {
    total: number;
    filled: number;
  };
  managingFarmers: OpportunityManager[];
  owner: OpportunityOwner;
  chatRoomId: string;
};

export type ApplicantStatus = "pending" | "approved" | "rejected";

export type Applicant = {
  id: string;
  name: string;
  message: string;
  status: ApplicantStatus;
  appliedAt: string;
  opportunityId: string;
  profile: {
    age: number;
    occupation: string;
    location: string;
  };
};


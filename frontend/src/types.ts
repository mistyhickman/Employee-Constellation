export interface MockIdentity {
  externalId: string;
  name: string;
  jobTitle: string | null;
}

export type TaxonomyType = "skills" | "industries" | "organizations" | "interests";

/** Projects and Communities reuse the admin taxonomy management UI/API
 * (rename/deactivate/merge) even though they aren't real `TaxonomyType`s —
 * see `AdminManagedType` in `adminTaxonomyService.ts` for why. */
export type AdminManagedType = TaxonomyType | "projects" | "communities";

export interface TaxonomyEntry {
  id: string;
  canonicalName: string;
  approved: boolean;
  kind?: "professional" | "personal";
}

export interface AdminTaxonomyEntry extends TaxonomyEntry {
  active: boolean;
  _count: { people: number };
}

export interface TaxonomyBrowseEntry extends TaxonomyEntry {
  count: number;
}

export interface PersonSkillView {
  id: string;
  proficiency: string | null;
  yearsExperience: number | null;
  willingToMentor: boolean;
  wantsToLearn: boolean;
  skill: { id: string; canonicalName: string };
}

export interface PersonIndustryView {
  id: string;
  depthOfExperience: string | null;
  industry: { id: string; canonicalName: string };
}

export interface PersonOrganizationView {
  id: string;
  relationshipType: string | null;
  role: string | null;
  organization: { id: string; canonicalName: string };
}

export interface PersonInterestView {
  id: string;
  direction: "current" | "want_to_explore";
  interest: { id: string; canonicalName: string; kind: "professional" | "personal" };
}

export interface PersonProjectView {
  id: string;
  role: string | null;
  project: { id: string; canonicalName: string };
}

export type ConnectionType =
  | "worked_together"
  | "mentor"
  | "mentee"
  | "sme_known"
  | "professional_contact"
  | "community"
  | "client_industry";

export interface PersonSummary {
  id: string;
  name: string;
  jobTitle: string | null;
  department?: string | null;
  photoUrl?: string | null;
}

export interface PersonConnectionView {
  id: string;
  relationshipType: ConnectionType;
  connectedPerson: PersonSummary;
}

export interface SearchResultPerson {
  id: string;
  name: string;
  jobTitle: string | null;
  department: string | null;
  skills: { skill: { id: string; canonicalName: string } }[];
  industries: { industry: { id: string; canonicalName: string } }[];
  projects: { project: { id: string; canonicalName: string } }[];
}

export interface MeResponse {
  id: string;
  entraObjectId: string;
  name: string;
  preferredName: string | null;
  pronouns: string | null;
  photoUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  location: string | null;
  workEmail: string;
  bio: string | null;
  birthdayMonth: number | null;
  birthdayDay: number | null;
  homeCity: string | null;
  homeState: string | null;
  roles: string[];
  skills: PersonSkillView[];
  industries: PersonIndustryView[];
  organizations: PersonOrganizationView[];
  interests: PersonInterestView[];
  connectionsOut: PersonConnectionView[];
  projects: PersonProjectView[];
}

export interface PersonDetailResponse {
  id: string;
  name: string;
  preferredName: string | null;
  pronouns: string | null;
  photoUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  location: string | null;
  workEmail: string | null;
  bio: string | null;
  birthdayMonth: number | null;
  birthdayDay: number | null;
  homeCity: string | null;
  homeState: string | null;
  skills: PersonSkillView[];
  industries: PersonIndustryView[];
  organizations: PersonOrganizationView[];
  interests: PersonInterestView[];
  connectionsOut: PersonConnectionView[];
  projects: PersonProjectView[];
  visibleSections: string[];
  adminBypassSections: string[];
}

export interface SimilarConnectionResponse {
  person: PersonSummary;
  sharedCount: number;
  sharedItems: SharedItem[];
}

export interface SharedItem {
  type: "skill" | "industry" | "organization" | "interest" | "project";
  id: string;
  label: string;
}

export interface SharedContextResponse {
  sharedCount: number;
  sharedItems: SharedItem[];
  complementary: string[];
}

export interface RelatedCount {
  id: string;
  canonicalName: string;
  count: number;
}

export interface TaxonomyNetworkResponse {
  center: { id: string; canonicalName: string; type: TaxonomyType };
  people: PersonSummary[];
  relatedSkills: RelatedCount[];
  relatedIndustries: RelatedCount[];
  relatedOrganizations: RelatedCount[];
  relatedProjects: RelatedCount[];
  relatedInterestsProfessional: RelatedCount[];
  relatedInterestsPersonal: RelatedCount[];
}

export interface DiscoverPersonCard extends PersonSummary {
  sharedCount: number;
  sharedItems: SharedItem[];
}

export interface DiscoverNewPerson extends PersonSummary {
  createdAt: string;
}

export interface DiscoverSharedInterest {
  id: string;
  canonicalName: string;
  kind: "professional" | "personal";
  othersCount: number;
}

export interface DiscoverUnexpectedOverlap {
  person: PersonSummary;
  interestName: string;
  interestKind: "professional" | "personal";
}

export interface DiscoverFeedResponse {
  peopleToMeet: DiscoverPersonCard[];
  trendingSkills: RelatedCount[];
  sharedInterests: DiscoverSharedInterest[];
  unexpectedOverlap: DiscoverUnexpectedOverlap | null;
  newPeople: DiscoverNewPerson[];
}

export interface ProjectBrowseEntry {
  id: string;
  canonicalName: string;
  description: string | null;
  active: boolean;
  clientOrganization: { id: string; canonicalName: string } | null;
  industry: { id: string; canonicalName: string } | null;
  _count: { people: number };
}

export interface ProjectPerson extends PersonSummary {
  role: string | null;
}

export interface ProjectNetworkResponse {
  id: string;
  canonicalName: string;
  description: string | null;
  clientOrganization: { id: string; canonicalName: string } | null;
  industry: { id: string; canonicalName: string } | null;
  skills: { id: string; canonicalName: string }[];
  people: ProjectPerson[];
  relatedProjects: RelatedCount[];
}

export interface CommunityBrowseEntry {
  id: string;
  canonicalName: string;
  description: string | null;
  memberCount: number;
  leaders: PersonSummary[];
  isMember: boolean;
}

export interface CommunityExpertiseHighlight {
  person: PersonSummary;
  skill: string;
}

export interface CommunityDetailResponse {
  id: string;
  canonicalName: string;
  description: string | null;
  isMember: boolean;
  isLeader: boolean;
  leaders: PersonSummary[];
  members: PersonSummary[];
  emergingSkills: RelatedCount[];
  mentors: CommunityExpertiseHighlight[];
  learners: CommunityExpertiseHighlight[];
}

export interface MentorshipSkillMatch {
  id: string;
  canonicalName: string;
  proficiency: string | null;
}

export interface MentorshipPersonMatch {
  person: PersonSummary;
  skills: MentorshipSkillMatch[];
}

export interface MentorshipFeedResponse {
  suggestedMentors: MentorshipPersonMatch[];
  suggestedMentees: MentorshipPersonMatch[];
  myMentors: PersonSummary[];
  myMentees: PersonSummary[];
}

export interface ExpertiseGap {
  id: string;
  canonicalName: string;
  wantsToLearnCount: number;
  willingToMentorCount: number;
  gap: number;
}

export interface OrgAnalyticsResponse {
  headcount: number;
  skillDistribution: RelatedCount[];
  industryDistribution: RelatedCount[];
  expertiseGaps: ExpertiseGap[];
  mentoringDemand: {
    totalWillingToMentor: number;
    totalWantsToLearn: number;
    topRequestedSkills: RelatedCount[];
  };
  profileFreshness: {
    totalEntries: number;
    staleEntries: number;
    percentFresh: number;
    staleThresholdDays: number;
  };
  communityGrowth: {
    totalCommunities: number;
    totalMemberships: number;
    byCommunity: { id: string; canonicalName: string; memberCount: number }[];
  };
}

export type VisibilityLevel = "private" | "team" | "company" | "leadership";

export type ProfileSection = "basic" | "skills" | "organizations" | "professional_interests" | "personal_interests" | "connections";

export interface VisibilitySettingView {
  section: ProfileSection;
  level: VisibilityLevel;
}

export interface NotificationPreferences {
  notifyMentorshipMatches: boolean;
  notifyCommunityActivity: boolean;
  notifyProfileReminders: boolean;
}

export interface SettingsResponse {
  visibility: VisibilitySettingView[];
  notifications: NotificationPreferences;
}

export type FeedbackType = "bug" | "feature" | "question";

export interface FeedbackSubmissionView {
  id: string;
  type: FeedbackType;
  message: string;
  createdAt: string;
  person: { id: string; name: string };
}

export interface AuditEventView {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  action: "edit" | "view";
  source: string;
  changedAt: string;
  changedBy: { id: string; name: string };
}

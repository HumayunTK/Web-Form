export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  country: string;
  religion?: string;
  blood_group?: string;
  marital_status?: string;
  institution?: string;
  hobbies?: string[];
  avatar_url?: string;
}
export interface Friend {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
}

export interface FriendsResponse {
  friends: Friend | Friend[] | null;
}

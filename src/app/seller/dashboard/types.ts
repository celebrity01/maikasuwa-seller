export interface SellerProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  shop_name: string;
  shop_address: string;
  home_as_business: boolean;
  city: string;
  state: string;
  lga: string;
  landmark: string;
  shop_type: string;
  photo_url: string | null;
  status: "pending" | "approved" | "rejected";
  is_disabled: boolean;
  default_password_set: boolean;
  created_at: string;
  updated_at: string;
}

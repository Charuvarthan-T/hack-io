export type course = {
  id: string;
  name: string;
};
import NextAuth from "next-auth";
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    userRole: string;
  }
}
export type user = {
  id: string;
  name: string;
  email: string;
  role: string;
  points_earned?: number;
};
export type semester = {
  id: string;
  name: string;
  year: string | number;
  dept_id?: string;
  department_name?: string;
};
export type department = {
  id: string;
  name: string;
};
export type section = {
  id: string;
  name: string;
  userid: string;
  semesterid: string;
  departmentid: string;
  isactive: boolean;
};
export type problem = {
  id: string;
  title: string;
  description: string;
  created_by?: string;
  created_at?: string;
  course?: string;
  function_signatures?: {
    javascript?: string;
    python?: string;
    java?: string;
    cpp?: string;
    c?: string;
  };
  template_type?: string;
  solved_status?: "solved" | "attempted" | "unsolved";
};
export type testCase = {
  id: string;
  input: string;
  output: string;
  created_at?: string;
};
export type contest = {
  id: string;
  title: string;
  description?: string | null;
  created_by: string;
  created_by_name?: string;
  start_time: Date | string;
  end_time: Date | string;
  duration_minutes?: number | null;
  is_active: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
  problem_count?: number;
  section_count?: number;
  solved_count?: number;
};

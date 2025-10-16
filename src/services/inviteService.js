// src/services/inviteService.js
import { supabase } from "./supabase";

export class InviteService {
  /**
   * Create a new invite code for a coach
   * @param {string} coachId - The coach's user ID
   * @param {string} clientEmail - Optional client email
   * @returns {Promise<string>} The generated invite code
   */
  static async createInvite(coachId, clientEmail = null) {
    try {
      const { data, error } = await supabase.rpc("create_coach_invite", {
        p_coach_id: coachId,
        p_client_email: clientEmail,
      });

      if (error) throw error;
      return data; // Returns the generated invite code
    } catch (error) {
      console.error("Error creating invite:", error);
      throw error;
    }
  }

  /**
   * Get all invites for a coach
   * @param {string} coachId - The coach's user ID
   * @returns {Promise<Array>} Array of invite objects
   */
  static async getCoachInvites(coachId) {
    try {
      const { data, error } = await supabase
        .from("coach_invites")
        .select(
          `
          id,
          invite_code,
          client_email,
          status,
          created_at,
          accepted_at,
          expires_at,
          used_by,
          client:used_by (
            name,
            email
          )
        `
        )
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching coach invites:", error);
      throw error;
    }
  }

  /**
   * Validate and get invite details by code
   * @param {string} inviteCode - The invite code to validate
   * @returns {Promise<Object>} Invite details with coach info
   */
  static async validateInviteCode(inviteCode) {
    try {
      const { data, error } = await supabase
        .from("coach_invites")
        .select(
          `
          id,
          coach_id,
          invite_code,
          client_email,
          status,
          expires_at,
          coach:coach_id (
            id,
            name,
            email
          )
        `
        )
        .eq("invite_code", inviteCode.toUpperCase())
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error) throw error;

      // Log to verify structure (optional)
      console.log("Validated invite:", data);

      return data;
    } catch (error) {
      console.error("Error validating invite code:", error);
      throw error;
    }
  }

  /**
   * Accept an invite and connect client to coach
   * @param {string} inviteCode - The invite code
   * @param {string} clientId - The client's user ID
   * @returns {Promise<Object>} Success result with coach info
   */
static async acceptInvite(inviteCode, clientId) {
  try {
    // First validate the invite
    const invite = await this.validateInviteCode(inviteCode);
    if (!invite) {
      throw new Error("Invalid or expired invite code");
    }

    console.log("Accepting invite:", { 
      inviteId: invite.id, 
      coachId: invite.coach_id, 
      clientId 
    });

    // 1. Create the coach-client relationship
    const { error: connectionError } = await supabase
      .from("coach_clients")
      .insert({
        coach_id: invite.coach_id,
        client_id: clientId,
      });

    if (connectionError) {
      if (connectionError.code === "23505") {
        // Duplicate key - client already connected
        // Still mark the invite as accepted since the relationship exists
        console.log("Client already connected, marking invite as accepted anyway");
      } else {
        throw connectionError;
      }
    }

    // 2. Mark the invite as accepted (THIS IS THE CRITICAL PART)
    const { data: updatedInvite, error: inviteUpdateError } = await supabase
      .from("coach_invites")
      .update({
        status: "accepted",
        used_by: clientId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id)
      .select()
      .single();

    if (inviteUpdateError) {
      console.error("CRITICAL: Failed to update invite status:", inviteUpdateError);
      // Don't throw - the connection was created, which is most important
      // But log it prominently so you know there's an issue
    } else {
      console.log("✅ Invite marked as accepted:", updatedInvite);
    }

    // Verify the update worked
    const { data: verifyInvite, error: verifyError } = await supabase
      .from("coach_invites")
      .select("status, used_by, accepted_at")
      .eq("id", invite.id)
      .single();

    if (!verifyError) {
      console.log("Verification - Invite status:", verifyInvite);
      if (verifyInvite.status !== "accepted") {
        console.error("⚠️ WARNING: Invite status was not updated to 'accepted'!");
      }
    }

    const coachName = invite.coach?.name || "Unknown Coach";

    return {
      success: true,
      coach: invite.coach,
      message: `Successfully connected to coach ${coachName}`,
    };
  } catch (error) {
    console.error("Error accepting invite:", error);
    throw error;
  }
}

  /**
   * Cancel an invite (coach only)
   * @param {string} inviteId - The invite ID to cancel
   * @param {string} coachId - The coach's user ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  static async cancelInvite(inviteId, coachId) {
    try {
      const { error } = await supabase
        .from("coach_invites")
        .update({ status: "cancelled" })
        .eq("id", inviteId)
        .eq("coach_id", coachId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error canceling invite:", error);
      throw error;
    }
  }

  /**
   * Get clients for a coach
   * @param {string} coachId - The coach's user ID
   * @returns {Promise<Array>} Array of client objects
   */
// ...existing code...
  static async getCoachClients(coachId) {
    try {
      if (!coachId) throw new Error("coachId is required");

      // include client_id so we can fallback if nested select yields nulls
      const { data, error } = await supabase
        .from("coach_clients")
        .select(
          `
          id,
          client_id,
          created_at,
          client:client_id (
            id,
            role,
            name,
            email,
            age,
            gender,
            subscription_tier,
            subscription_status,
            profile_complete,
            created_at
          )
        `
        )
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });

      console.log("raw coach_clients data:", data, "error:", error);
      if (error) throw error;

      // If nested join worked, return mapped clients
      const clientsWithNested = (data || [])
        .map((row) => (row.client ? { linkId: row.id, linkedAt: row.created_at, client: row.client } : null))
        .filter(Boolean);

      if (clientsWithNested.length > 0) {
        console.log("clients (nested):", clientsWithNested);
        return clientsWithNested;
      }

      // Fallback: fetch users by client_id if nested join returned nulls
      const clientIds = (data || []).map((r) => r.client_id).filter(Boolean);
      if (clientIds.length === 0) return [];

      const { data: users, error: usersErr } = await supabase
        .from("users")
        .select(
          `id, role, name, email, age, gender, subscription_tier, subscription_status, profile_complete, created_at`
        )
        .in("id", clientIds);

      if (usersErr) throw usersErr;

      // Map users back to links
      console.log("raw coach_clients data:", data);
      const usersById = (users || []).reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
      const clients = (data || [])
        .map((row) => {
          const u = usersById[row.client_id];
          return u ? { linkId: row.id, linkedAt: row.created_at, client: u } : null;
        })
        .filter(Boolean);

      console.log("clients (fallback):", clients);
      return clients;
    } catch (error) {
      console.error("Error fetching coach clients:", error);
      throw error;
    }
  }
// ...existing code...
  /**
   * Check if a client has a coach
   * @param {string} clientId - The client's user ID
   * @returns {Promise<Object|null>} Coach info or null if no coach
   */
  static async getClientCoach(clientId) {
    try {
      const { data, error } = await supabase
        .from("coach_clients")
        .select(
          `
          id,
          created_at,
          coach:coach_id (
            id,
            name,
            email
          )
        `
        )
        .eq("client_id", clientId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching client coach:", error);
      throw error;
    }
  }
}

export default InviteService;

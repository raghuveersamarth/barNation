// src/services/inviteService.js
import { supabase } from './supabase';

export class InviteService {
  /**
   * Create a new invite code for a coach
   * @param {string} coachId - The coach's user ID
   * @param {string} clientEmail - Optional client email
   * @returns {Promise<string>} The generated invite code
   */
  static async createInvite(coachId, clientEmail = null) {
    try {
      const { data, error } = await supabase.rpc('create_coach_invite', {
        p_coach_id: coachId,
        p_client_email: clientEmail
      });

      if (error) throw error;
      return data; // Returns the generated invite code
    } catch (error) {
      console.error('Error creating invite:', error);
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
        .from('coach_invites')
        .select(`
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
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching coach invites:', error);
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
        .from('coach_invites')
        .select(`
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
        `)
        .eq('invite_code', inviteCode.toUpperCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error validating invite code:', error);
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
        throw new Error('Invalid or expired invite code');
      }

      // Start a transaction-like operation
      // 1. Create the coach-client relationship
      const { error: connectionError } = await supabase
        .from('coach_clients')
        .insert({
          coach_id: invite.coach_id,
          client_id: clientId
        });

      if (connectionError) {
        // Handle duplicate connection gracefully
        if (connectionError.code === '23505') { // Unique constraint violation
          throw new Error('You are already connected to this coach');
        }
        throw connectionError;
      }

      // 2. Mark the invite as accepted
      const { error: inviteUpdateError } = await supabase
        .from('coach_invites')
        .update({
          status: 'accepted',
          used_by: clientId,
          accepted_at: new Date().toISOString()
        })
        .eq('id', invite.id);

      if (inviteUpdateError) {
        console.warn('Warning: Could not update invite status:', inviteUpdateError);
      }

      return {
        success: true,
        coach: invite.coach,
        message: `Successfully connected to coach ${invite.coach.name}`
      };

    } catch (error) {
      console.error('Error accepting invite:', error);
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
        .from('coach_invites')
        .update({ status: 'cancelled' })
        .eq('id', inviteId)
        .eq('coach_id', coachId); // Ensure only the coach can cancel their own invites

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error canceling invite:', error);
      throw error;
    }
  }

  /**
   * Get clients for a coach
   * @param {string} coachId - The coach's user ID
   * @returns {Promise<Array>} Array of client objects
   */
  static async getCoachClients(coachId) {
    try {
      const { data, error } = await supabase
        .from('coach_clients')
        .select(`
          id,
          created_at,
          client:client_id (
            id,
            name,
            email,
            age,
            gender,
            created_at
          )
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching coach clients:', error);
      throw error;
    }
  }

  /**
   * Check if a client has a coach
   * @param {string} clientId - The client's user ID
   * @returns {Promise<Object|null>} Coach info or null if no coach
   */
  static async getClientCoach(clientId) {
    try {
      const { data, error } = await supabase
        .from('coach_clients')
        .select(`
          id,
          created_at,
          coach:coach_id (
            id,
            name,
            email
          )
        `)
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching client coach:', error);
      throw error;
    }
  }
}

export default InviteService;
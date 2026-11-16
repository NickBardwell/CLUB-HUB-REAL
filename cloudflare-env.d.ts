declare namespace Cloudflare {
  interface Env {
    CLUB_HUB_ADMIN_EMAILS?: string;
    CLUB_HUB_BOOTSTRAP_ORGANIZERS?: string;
    OPENAI_API_KEY?: string;
    CLUB_BUILDER_INVITES?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}


import { Client, GatewayIntentBits, ChannelType, PermissionsBitField } from "discord.js";
import { neon } from "@neondatabase/serverless";

export type EventType = 
    | "team.created"
    | "team.member.added"
    | "team.member.removed"
    | "submission.submitted"
    | "hackathon.completed";

interface EventPayload {
    type: EventType;
    data: any;
    timestamp: Date;
}

// Initialize Discord Client
const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Required for permissions
    ]
});

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
let isClientReady = false;

if (DISCORD_BOT_TOKEN) {
    discordClient.login(DISCORD_BOT_TOKEN).then(() => {
        isClientReady = true;
        console.log("Discord Bot Logged In");
    }).catch(err => console.error("Discord Login Failed:", err));
}

// Database Connection for updates
const sql = neon(process.env.DATABASE_URL!);

export async function emitEvent(type: EventType, data: any) {
    const event: EventPayload = {
        type,
        data,
        timestamp: new Date()
    };
    
    console.log(`[EVENT EMITTED] ${type}:`, JSON.stringify(data, null, 2));

    if (!isClientReady) {
        console.warn("Discord Client not ready, skipping Discord actions");
        return;
    }

    try {
        if (type === "team.created") {
            await handleTeamCreated(data);
        }
    } catch (error) {
        console.error("Error handling event:", error);
    }
}

async function handleTeamCreated(data: any) {
    const { team_id, hackathon_id, name } = data;

    // 1. Get Hackathon Settings
    const hackathon = await sql`
        SELECT discord_enabled, discord_server_type, discord_category_id 
        FROM hackathons 
        WHERE id = ${hackathon_id}
    `;

    if (!hackathon || !hackathon[0] || !hackathon[0].discord_enabled || hackathon[0].discord_server_type !== 'INTERNAL') {
        return; // Skip if not enabled or not internal
    }

    const categoryId = hackathon[0].discord_category_id;
    if (!categoryId) {
        console.warn("No Discord Category ID configured for this hackathon");
        return;
    }

    // 2. Fetch Guild (Assuming the bot is in the configured server)
    // For now, we find the guild that has this category
    // In a multi-tenant app, we might store guild_id too, but here we assume the bot knows the guild via the Category
    try {
        const channel = await discordClient.channels.fetch(categoryId);
        if (!channel || channel.type !== ChannelType.GuildCategory) {
            console.error("Invalid Category ID");
            return;
        }

        const guild = channel.guild;

        // 3. Create Channel
        const newChannel = await guild.channels.create({
            name: `team-${name.toLowerCase().replace(/\s+/g, '-')}`,
            type: ChannelType.GuildText,
            parent: categoryId,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                // We can add specific logic here later (e.g. add bot role, etc)
            ],
        });

        console.log(`Created Discord Channel: ${newChannel.name} (${newChannel.id})`);

        // 4. Update Database
        await sql`
            UPDATE hackathon_teams 
            SET discord_channel_id = ${newChannel.id}
            WHERE id = ${team_id}
        `;

    } catch (error) {
        console.error("Error creating Discord channel:", error);
    }
}

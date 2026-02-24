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
const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
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
    const hackathon = await sql`
        SELECT discord_enabled, discord_server_type, discord_category_id
        FROM hackathons
        WHERE id = ${hackathon_id}
    `;
    if (!hackathon || !hackathon[0] || !hackathon[0].discord_enabled || hackathon[0].discord_server_type !== 'INTERNAL') {
        return;
    }
    const categoryId = hackathon[0].discord_category_id;
    if (!categoryId) {
        console.warn("No Discord Category ID configured for this hackathon");
        return;
    }
    try {
        const channel = await discordClient.channels.fetch(categoryId);
        if (!channel || channel.type !== ChannelType.GuildCategory) {
            console.error("Invalid Category ID");
            return;
        }
        const guild = channel.guild;
        const newChannel = await guild.channels.create({
            name: `team-${name.toLowerCase().replace(/\s+/g, '-')}`,
            type: ChannelType.GuildText,
            parent: categoryId,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });
        console.log(`Created Discord Channel: ${newChannel.name} (${newChannel.id})`);
        await sql`
            UPDATE hackathon_teams
            SET discord_channel_id = ${newChannel.id}
            WHERE id = ${team_id}
        `;
    } catch (error) {
        console.error("Error creating Discord channel:", error);
    }
}

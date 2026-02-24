import axios from "axios";
import * as cheerio from "cheerio";
import { CreateExternalHackathonDTO, createExternalHackathon } from "@/repository/external_hackathon.repository";
import { SKILL_TAXONOMY, SkillType } from "./skill-tracker.service";

export class ScraperService {
    /**
     * Scrapes hackathons from Devpost (example)
     */
    static async scrapeDevpost() {
        console.log("Starting Devpost scraping...");
        try {
            const { data } = await axios.get("https://devpost.com/hackathons", {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);
            const hackathons: CreateExternalHackathonDTO[] = [];

            const elements = $(".hackathon-tile, .featured-hackathon").toArray();
            for (const element of elements) {
                const title = $(element).find("h3, .title").text().trim();
                const description = $(element).find(".oneline, .info").text().trim();
                const external_url = $(element).find("a").attr("href") || "";
                const deadlineText = $(element).find(".submission-period b, .status").text().trim();

                let deadline: Date | undefined;
                if (deadlineText) {
                    const match = deadlineText.match(/(\w+ \d+, \d+)/);
                    if (match) {
                        deadline = new Date(match[1]);
                    } else if (deadlineText.toLowerCase().includes("days left")) {
                        const days = parseInt(deadlineText.match(/\d+/)?.[0] || "0");
                        deadline = new Date();
                        deadline.setDate(deadline.getDate() + days);
                    }
                }

                if (title && external_url && external_url.startsWith("http") && (!deadline || deadline > new Date())) {
                    // Pre-verify link working
                    const isValid = await this.validateLink(external_url);
                    if (isValid) {
                        hackathons.push({
                            title,
                            description,
                            external_url,
                            deadline,
                            mode: "online",
                            source: "Devpost",
                            skills: this.extractSkills(description + " " + title)
                        });
                    }
                }
            }

            console.log(`Found ${hackathons.length} active and verified hackathons on Devpost.`);
            for (const hack of hackathons) {
                await createExternalHackathon(hack);
            }
            return hackathons;
        } catch (error) {
            console.error("Devpost scraping failed:", error);
            throw error;
        }
    }

    /**
     * Scrapes hackathons from Unstop.
     */
    static async scrapeUnstop() {
        console.log("Starting Unstop scraping...");
        try {
            const { data } = await axios.get("https://unstop.com/hackathons", {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);
            const hackathons: CreateExternalHackathonDTO[] = [];

            const elements = $(".competition-card, .listing-card, .event-card").toArray();
            for (const element of elements) {
                const title = $(element).find(".title, h2, h3").first().text().trim();
                const rawUrl = $(element).find("a").attr("href") || "";
                
                function emptyLink(l: string) { return !l || l === "#" || l === "javascript:void(0)"; }
                const external_url = emptyLink(rawUrl) ? "" : (rawUrl.startsWith("http") ? rawUrl : "https://unstop.com" + rawUrl);
                
                const description = $(element).find(".subtitle, .description").text().trim();

                const timeLeft = $(element).find(".time-left, .status, .day-left").text().trim();
                let deadline: Date | undefined;

                if (timeLeft.toLowerCase().includes("left") || timeLeft.toLowerCase().includes("ends")) {
                    const match = timeLeft.match(/(\d+)\s*(days?|hrs?|hours?)/i);
                    if (match) {
                        const amount = parseInt(match[1]);
                        const unit = match[2].toLowerCase();
                        deadline = new Date();
                        if (unit.startsWith("day")) {
                            deadline.setDate(deadline.getDate() + amount);
                        } else {
                            deadline.setHours(deadline.getHours() + amount);
                        }
                    }
                }

                if (title && external_url.length > 15 && (!deadline || deadline > new Date())) {
                    const isValid = await this.validateLink(external_url);
                    if (isValid) {
                        hackathons.push({
                            title,
                            description,
                            external_url,
                            deadline,
                            mode: "online",
                            source: "Unstop",
                            skills: this.extractSkills(description + " " + title)
                        });
                    }
                }
            }

            console.log(`Found ${hackathons.length} active and verified hackathons on Unstop.`);
            for (const hack of hackathons) {
                await createExternalHackathon(hack);
            }
            return hackathons;
        } catch (error) {
            console.error("Unstop scraping failed:", error);
            return [];
        }
    }

    /**
     * Validates if a link is actually working.
     */
    static async validateLink(url: string): Promise<boolean> {
        try {
            // Try HEAD first as it's lighter
            await axios.head(url, {
                timeout: 5000,
                maxRedirects: 3,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            return true;
        } catch (error) {
            // Fallback to GET for sites that block HEAD
            try {
                await axios.get(url, {
                    timeout: 8000,
                    maxRedirects: 3,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                return true;
            } catch (err) {
                console.warn(`Blocking broken link: ${url}`);
                return false;
            }
        }
    }

    /**
     * Extracts skills from text based on keywords.
     */
    static extractSkills(text: string): SkillType[] {
        const found: SkillType[] = [];
        const t = text.toLowerCase();

        const mapping: Record<string, SkillType[]> = {
            "web": ["frontend", "backend"],
            "react": ["frontend"],
            "node": ["backend"],
            "python": ["ai_ml", "backend"],
            "ml": ["ai_ml"],
            "ai": ["ai_ml"],
            "intelligence": ["ai_ml"],
            "mobile": ["mobile"],
            "app": ["mobile"],
            "ios": ["mobile"],
            "android": ["mobile"],
            "cloud": ["devops"],
            "docker": ["devops"],
            "kubernetes": ["devops"],
            "blockchain": ["web3"],
            "crypto": ["web3"],
            "ethereum": ["web3"],
            "design": ["ui_ux"],
            "ui": ["ui_ux"],
            "ux": ["ui_ux"],
            "competitive": ["competitive_programming"],
            "algorithm": ["competitive_programming"],
            "dsa": ["competitive_programming"]
        };

        for (const [keyword, skills] of Object.entries(mapping)) {
            if (t.includes(keyword)) {
                skills.forEach(skill => {
                    if (!found.includes(skill)) found.push(skill);
                });
            }
        }

        return found;
    }
}

import React, { useState } from 'react';
import './AppStore.css';
import { ModernIcon } from './ModernIcon';


// --- App Store App Data ---
export interface StoreApp {
    id: string;
    name: string;
    url: string;
    icon: string;
    description: string;
    tags: string[];
    category: string;
    gradient?: string;
}

export const STORE_APPS: StoreApp[] = [
    // KDS Ecosystem
    { id: 'workspace', name: 'KDS Workspace', url: 'https://workspace.kierendaystudios.co.uk/', icon: '💼', description: 'Docs, slides, spreadsheets, notes and project management.', tags: ['Productivity', 'Office', 'KDS'], category: 'KDS Ecosystem', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    { id: 'retbuild', name: 'Retbuild', url: 'https://retbuild.co.uk/', icon: '🛠️', description: 'Build micro apps, software prototypes and ai agents with Google\'s Gemini.', tags: ['Development', 'AI', 'Low-code'], category: 'KDS Ecosystem', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { id: 'code', name: 'KDS Code', url: 'https://codestudio.kierendaystudios.co.uk/', icon: '💻', description: 'Modern sleek IDE for creating web based applications and platforms.', tags: ['Development', 'IDE', 'Code'], category: 'KDS Ecosystem', gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
    { id: 'founders', name: 'KDS Founders OS', url: 'https://founders.kierendaystudios.co.uk/', icon: '🚀', description: 'Manage business projects, ideas, links, tasks, roadmaps and more.', tags: ['Productivity', 'Business', 'Planning'], category: 'KDS Ecosystem', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { id: 'academy', name: 'KDS Web Academy', url: 'https://academy.kierendaystudios.co.uk/', icon: '🎓', description: 'Learn how to build websites in HTML, CSS, and JS with a built-in IDE.', tags: ['Education', 'Coding', 'Web'], category: 'KDS Ecosystem', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    { id: 'stock', name: 'KDS Stock Images', url: 'https://stock.kierendaystudios.co.uk/', icon: '📸', description: 'Commercially free to use stock images.', tags: ['Creative', 'Assets', 'Images'], category: 'KDS Ecosystem', gradient: 'linear-gradient(135deg, #6b7280, #4b5563)' },
    { id: 'gamedev', name: 'Game Dev Center', url: 'https://gamedev.kierendaystudios.co.uk/#/dashboard', icon: '🕹️', description: 'Micro tools and submission route for KDS gaming platform.', tags: ['GameDev', 'Tools', 'Gaming'], category: 'KDS Ecosystem', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    { id: 'gaming', name: 'KDS Gaming', url: 'https://gaming.kierendaystudios.co.uk/#/dashboard', icon: '🎮', description: 'Indie gaming platform by KDS.', tags: ['Games', 'Entertainment', 'Social'], category: 'KDS Ecosystem', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },

    // Search & Information
    { id: 'google', name: 'Google', url: 'https://www.google.com', icon: '🔍', description: 'The world\'s most used search engine, organizing information and providing tools like Maps, Gmail, and Docs.', tags: ['Search', 'Productivity', 'Information'], category: 'Search & Tools' },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com', icon: '🔎', description: 'Microsoft\'s search engine with integrated AI and web tools.', tags: ['Search', 'AI', 'Information'], category: 'Search & Tools' },
    { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://www.duckduckgo.com', icon: '🦆', description: 'A privacy-focused search engine.', tags: ['Search', 'Privacy', 'Security'], category: 'Search & Tools' },
    { id: 'wikipedia', name: 'Wikipedia', url: 'https://www.wikipedia.org', icon: '📚', description: 'A free, community-edited encyclopedia covering almost every topic imaginable.', tags: ['Knowledge', 'Reference', 'Education'], category: 'Search & Tools' },
    { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com', icon: '🔷', description: 'China\'s leading search engine and AI-driven web platform.', tags: ['Search', 'AI', 'China'], category: 'Search & Tools' },
    { id: 'yandex', name: 'Yandex', url: 'https://www.yandex.com', icon: '🔴', description: 'A major Russian search engine and internet services provider.', tags: ['Search', 'Maps', 'Services'], category: 'Search & Tools' },

    // Social & Communication
    { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com', icon: '▶️', description: 'The largest video platform, hosting entertainment, education, and creator-driven content worldwide.', tags: ['Video', 'Entertainment', 'Creators'], category: 'Entertainment' },
    { id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com', icon: '👥', description: 'A social network built around communities, messaging, groups, and digital relationships.', tags: ['Social', 'Community', 'Networking'], category: 'Social' },
    { id: 'x', name: 'X (Twitter)', url: 'https://www.x.com', icon: '𝕏', description: 'A real-time discussion platform for news, opinions, and public conversation.', tags: ['Social', 'News', 'Microblogging'], category: 'Social' },
    { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com', icon: '📷', description: 'A visual social platform focused on photos, short videos, and personal branding.', tags: ['Social', 'Visual', 'Creators'], category: 'Social' },
    { id: 'reddit', name: 'Reddit', url: 'https://www.reddit.com', icon: '🟠', description: 'A massive collection of forums where users discuss, vote, and share content by interest.', tags: ['Community', 'Discussion', 'Forums'], category: 'Social' },
    { id: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com', icon: '💼', description: 'The leading professional network for careers, hiring, and business networking.', tags: ['Professional', 'Careers', 'Business'], category: 'Business' },
    { id: 'whatsapp-web', name: 'WhatsApp Web', url: 'https://web.whatsapp.com', icon: '💬', description: 'Browser-based messaging for personal and group communication.', tags: ['Messaging', 'Communication', 'Social'], category: 'Messaging' },
    { id: 'whatsapp', name: 'WhatsApp', url: 'https://www.whatsapp.com', icon: '📱', description: 'Private messaging platform used globally across mobile and web.', tags: ['Messaging', 'Communication', 'Social'], category: 'Messaging' },
    { id: 'telegram', name: 'Telegram', url: 'https://www.telegram.org', icon: '✈️', description: 'Cloud-based messaging focused on speed, privacy, and large communities.', tags: ['Messaging', 'Privacy', 'Communities'], category: 'Messaging' },
    { id: 'wechat', name: 'WeChat', url: 'https://www.wechat.com', icon: '💚', description: 'An all-in-one super app combining messaging, payments, and services.', tags: ['Messaging', 'Payments', 'Ecosystem'], category: 'Messaging' },
    { id: 'discord', name: 'Discord', url: 'https://www.discord.com', icon: '🎮', description: 'A communication platform for communities, gaming, and collaboration.', tags: ['Community', 'Chat', 'Gaming'], category: 'Social' },
    { id: 'slack', name: 'Slack', url: 'https://www.slack.com', icon: '💼', description: 'Team communication and collaboration platform.', tags: ['Work', 'Communication', 'Teams'], category: 'Work Tools' },
    { id: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com', icon: '🎵', description: 'Short-form video platform driving modern internet culture and trends.', tags: ['Video', 'Social', 'Trends'], category: 'Entertainment' },
    { id: 'pinterest', name: 'Pinterest', url: 'https://www.pinterest.com', icon: '📌', description: 'A visual discovery platform for ideas, inspiration, and planning.', tags: ['Inspiration', 'Visual', 'Lifestyle'], category: 'Lifestyle' },
    { id: 'quora', name: 'Quora', url: 'https://www.quora.com', icon: '❓', description: 'A knowledge-sharing platform built around questions and expert answers.', tags: ['Knowledge', 'Q&A', 'Learning'], category: 'Education' },
    { id: 'vk', name: 'VK', url: 'https://www.vk.com', icon: '🔵', description: 'Popular social network across Eastern Europe and Russia.', tags: ['Social', 'Media', 'Community'], category: 'Social' },

    // Entertainment & Media
    { id: 'netflix', name: 'Netflix', url: 'https://www.netflix.com', icon: '🎬', description: 'A global streaming service offering films, series, and original content.', tags: ['Streaming', 'Entertainment', 'Media'], category: 'Entertainment' },
    { id: 'twitch', name: 'Twitch', url: 'https://www.twitch.tv', icon: '📺', description: 'Live streaming platform focused on gaming, creators, and real-time interaction.', tags: ['Streaming', 'Gaming', 'Live'], category: 'Entertainment' },
    { id: 'spotify', name: 'Spotify', url: 'https://www.spotify.com', icon: '🎧', description: 'A music and podcast streaming service with global reach.', tags: ['Music', 'Audio', 'Streaming'], category: 'Entertainment' },
    { id: 'soundcloud', name: 'SoundCloud', url: 'https://www.soundcloud.com', icon: '☁️', description: 'An audio platform for sharing music and podcasts.', tags: ['Audio', 'Music', 'Creators'], category: 'Entertainment' },
    { id: 'imdb', name: 'IMDB', url: 'https://www.imdb.com', icon: '🌟', description: 'The world\'s largest database for movies, TV shows, and actors.', tags: ['Entertainment', 'Movies', 'Database'], category: 'Entertainment' },
    { id: 'fandom', name: 'Fandom', url: 'https://www.fandom.com', icon: '🎲', description: 'A wiki platform dedicated to games, movies, and pop culture.', tags: ['Community', 'Wikis', 'Entertainment'], category: 'Entertainment' },

    // News & Media
    { id: 'bbc', name: 'BBC', url: 'https://www.bbc.com', icon: '📰', description: 'A major global news and media organisation.', tags: ['News', 'Media', 'Broadcasting'], category: 'News' },
    { id: 'cnn', name: 'CNN', url: 'https://www.cnn.com', icon: '🌐', description: 'International news covering politics, business, and world events.', tags: ['News', 'Journalism', 'Global'], category: 'News' },
    { id: 'yahoo', name: 'Yahoo', url: 'https://www.yahoo.com', icon: '📧', description: 'A long-standing portal offering news, email, finance, and media content.', tags: ['News', 'Portal', 'Email'], category: 'News' },
    { id: 'nytimes', name: 'NYTimes', url: 'https://www.nytimes.com', icon: '📰', description: 'Leading international newspaper and media outlet.', tags: ['News', 'Journalism', 'Media'], category: 'News' },
    { id: 'guardian', name: 'The Guardian', url: 'https://www.theguardian.com', icon: '📰', description: 'Independent global news organisation.', tags: ['News', 'Media', 'Journalism'], category: 'News' },
    { id: 'forbes', name: 'Forbes', url: 'https://www.forbes.com', icon: '💰', description: 'Business, finance, and leadership media brand.', tags: ['Business', 'Finance', 'Media'], category: 'News' },
    { id: 'bloomberg', name: 'Bloomberg', url: 'https://www.bloomberg.com', icon: '📊', description: 'Financial news, data, and market insights.', tags: ['Finance', 'Markets', 'Business'], category: 'News' },
    { id: 'hackernews', name: 'Hacker News', url: 'https://news.ycombinator.com', icon: '🔶', description: 'Tech and startup-focused news aggregation site.', tags: ['Tech', 'Startups', 'News'], category: 'News' },
    { id: 'weather', name: 'Weather.com', url: 'https://www.weather.com', icon: '🌤️', description: 'Global weather forecasting and data platform.', tags: ['Weather', 'Information', 'Forecasts'], category: 'News' },
    { id: 'accuweather', name: 'AccuWeather', url: 'https://www.accuweather.com', icon: '⛅', description: 'Detailed weather tracking and alerts.', tags: ['Weather', 'Forecasting', 'Alerts'], category: 'News' },

    // Shopping & E-commerce
    { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.com', icon: '🛒', description: 'The largest online marketplace for shopping, digital services, and cloud infrastructure.', tags: ['E-commerce', 'Retail', 'Cloud'], category: 'Shopping' },
    { id: 'ebay', name: 'eBay', url: 'https://www.ebay.com', icon: '🏷️', description: 'A global marketplace for auctions and direct sales.', tags: ['E-commerce', 'Marketplace', 'Trading'], category: 'Shopping' },
    { id: 'alibaba', name: 'Alibaba', url: 'https://www.alibaba.com', icon: '🏭', description: 'Global wholesale marketplace connecting manufacturers and buyers.', tags: ['E-commerce', 'Wholesale', 'Trade'], category: 'Shopping' },
    { id: 'aliexpress', name: 'AliExpress', url: 'https://www.aliexpress.com', icon: '📦', description: 'International consumer marketplace for affordable goods.', tags: ['E-commerce', 'Retail', 'Global'], category: 'Shopping' },
    { id: 'taobao', name: 'Taobao', url: 'https://www.taobao.com', icon: '🛍️', description: 'One of the world\'s largest consumer marketplaces.', tags: ['E-commerce', 'Marketplace', 'China'], category: 'Shopping' },
    { id: 'jd', name: 'JD.com', url: 'https://www.jd.com', icon: '🚚', description: 'Major Chinese e-commerce platform with strong logistics.', tags: ['E-commerce', 'Logistics', 'Retail'], category: 'Shopping' },
    { id: 'walmart', name: 'Walmart', url: 'https://www.walmart.com', icon: '🏬', description: 'Major global retailer with strong online presence.', tags: ['Retail', 'E-commerce', 'Shopping'], category: 'Shopping' },
    { id: 'target', name: 'Target', url: 'https://www.target.com', icon: '🎯', description: 'Retail brand with strong digital and in-store integration.', tags: ['Retail', 'Shopping', 'Lifestyle'], category: 'Shopping' },
    { id: 'costco', name: 'Costco', url: 'https://www.costco.com', icon: '🛒', description: 'Membership-based retail and wholesale platform.', tags: ['Retail', 'Wholesale', 'Membership'], category: 'Shopping' },
    { id: 'bestbuy', name: 'Best Buy', url: 'https://www.bestbuy.com', icon: '🔌', description: 'Consumer electronics retail and online store.', tags: ['Electronics', 'Retail', 'Technology'], category: 'Shopping' },
    { id: 'etsy', name: 'Etsy', url: 'https://www.etsy.com', icon: '🎨', description: 'Marketplace for handmade, vintage, and creative goods.', tags: ['Marketplace', 'Handmade', 'Creators'], category: 'Shopping' },

    // Business & Productivity
    { id: 'microsoft', name: 'Microsoft', url: 'https://www.microsoft.com', icon: '🪟', description: 'Home to Windows, Office, cloud tools, and enterprise software solutions.', tags: ['Software', 'Productivity', 'Enterprise'], category: 'Business' },
    { id: 'apple', name: 'Apple', url: 'https://www.apple.com', icon: '🍎', description: 'Official site for Apple products, services, and ecosystem tools.', tags: ['Technology', 'Hardware', 'Ecosystem'], category: 'Business' },
    { id: 'salesforce', name: 'Salesforce', url: 'https://www.salesforce.com', icon: '☁️', description: 'A leading CRM platform for managing customer relationships.', tags: ['Business', 'CRM', 'Enterprise'], category: 'Business' },
    { id: 'office', name: 'Office.com', url: 'https://www.office.com', icon: '📄', description: 'Online access to Microsoft Office tools and cloud productivity.', tags: ['Productivity', 'Documents', 'Cloud'], category: 'Productivity' },
    { id: 'outlook', name: 'Outlook', url: 'https://www.outlook.com', icon: '📧', description: 'Email and calendar services by Microsoft.', tags: ['Email', 'Productivity', 'Communication'], category: 'Productivity' },
    { id: 'notion', name: 'Notion', url: 'https://www.notion.so', icon: '📝', description: 'An all-in-one workspace for notes, tasks, and knowledge management.', tags: ['Productivity', 'Workspace', 'Organization'], category: 'Productivity' },
    { id: 'dropbox', name: 'Dropbox', url: 'https://www.dropbox.com', icon: '📦', description: 'Cloud storage and file sharing for individuals and teams.', tags: ['Cloud', 'Storage', 'Productivity'], category: 'Productivity' },
    { id: 'zoom', name: 'Zoom', url: 'https://www.zoom.us', icon: '🎥', description: 'A leading platform for video conferencing and remote meetings.', tags: ['Video', 'Remote Work', 'Communication'], category: 'Productivity' },
    { id: 'asana', name: 'Asana', url: 'https://www.asana.com', icon: '📋', description: 'Project and task management tool.', tags: ['Productivity', 'Projects', 'Teams'], category: 'Work Tools' },
    { id: 'trello', name: 'Trello', url: 'https://www.trello.com', icon: '📌', description: 'Visual task and workflow management platform.', tags: ['Productivity', 'Boards', 'Organization'], category: 'Work Tools' },
    { id: 'monday', name: 'Monday.com', url: 'https://www.monday.com', icon: '📊', description: 'Work operating system for teams and companies.', tags: ['Workflows', 'Management', 'Teams'], category: 'Work Tools' },
    { id: 'clickup', name: 'ClickUp', url: 'https://www.clickup.com', icon: '✅', description: 'All-in-one productivity and project management tool.', tags: ['Productivity', 'Tasks', 'Teams'], category: 'Work Tools' },

    // Cloud & Storage
    { id: 'icloud', name: 'iCloud', url: 'https://www.icloud.com', icon: '☁️', description: 'Apple\'s cloud platform for storage and syncing.', tags: ['Cloud', 'Storage', 'Apple'], category: 'Cloud' },
    { id: 'gdrive', name: 'Google Drive', url: 'https://drive.google.com', icon: '📁', description: 'Cloud storage and collaboration platform.', tags: ['Cloud', 'Storage', 'Collaboration'], category: 'Cloud' },
    { id: 'gdocs', name: 'Google Docs', url: 'https://docs.google.com', icon: '📄', description: 'Online document editing and collaboration tool.', tags: ['Writing', 'Collaboration', 'Productivity'], category: 'Cloud' },
    { id: 'gmaps', name: 'Google Maps', url: 'https://maps.google.com', icon: '🗺️', description: 'The most-used mapping and navigation service.', tags: ['Maps', 'Navigation', 'Location'], category: 'Search & Tools' },

    // Finance & Payments
    { id: 'paypal', name: 'PayPal', url: 'https://www.paypal.com', icon: '💳', description: 'A widely used digital payment and money transfer service.', tags: ['Payments', 'Finance', 'Online'], category: 'Finance' },
    { id: 'stripe', name: 'Stripe', url: 'https://www.stripe.com', icon: '💰', description: 'Online payment infrastructure for businesses and developers.', tags: ['Payments', 'Fintech', 'APIs'], category: 'Finance' },
    { id: 'investopedia', name: 'Investopedia', url: 'https://www.investopedia.com', icon: '📈', description: 'Educational resource for finance and investing.', tags: ['Finance', 'Education', 'Investing'], category: 'Finance' },
    { id: 'tradingview', name: 'TradingView', url: 'https://www.tradingview.com', icon: '📊', description: 'Market charting and analysis platform.', tags: ['Trading', 'Charts', 'Finance'], category: 'Finance' },
    { id: 'coinmarketcap', name: 'CoinMarketCap', url: 'https://www.coinmarketcap.com', icon: '🪙', description: 'Cryptocurrency price tracking and data.', tags: ['Crypto', 'Markets', 'Data'], category: 'Finance' },
    { id: 'coinbase', name: 'Coinbase', url: 'https://www.coinbase.com', icon: '💎', description: 'Cryptocurrency exchange and wallet platform.', tags: ['Crypto', 'Finance', 'Exchange'], category: 'Finance' },
    { id: 'binance', name: 'Binance', url: 'https://www.binance.com', icon: '🟡', description: 'Largest cryptocurrency exchange by volume.', tags: ['Crypto', 'Trading', 'Exchange'], category: 'Finance' },
    { id: 'payoneer', name: 'Payoneer', url: 'https://www.payoneer.com', icon: '💵', description: 'Global payment platform for businesses and freelancers.', tags: ['Payments', 'Finance', 'Global'], category: 'Finance' },
    { id: 'wise', name: 'Wise', url: 'https://www.wise.com', icon: '🌍', description: 'International money transfer and banking platform.', tags: ['Finance', 'Transfers', 'Banking'], category: 'Finance' },
    { id: 'revolut', name: 'Revolut', url: 'https://www.revolut.com', icon: '💳', description: 'Digital banking and financial services app.', tags: ['Banking', 'Finance', 'Fintech'], category: 'Finance' },
    { id: 'intuit', name: 'Intuit', url: 'https://www.intuit.com', icon: '🧮', description: 'Financial software for accounting and tax.', tags: ['Finance', 'Accounting', 'Software'], category: 'Finance' },
    { id: 'turbotax', name: 'TurboTax', url: 'https://www.turbotax.intuit.com', icon: '📋', description: 'Online tax filing software.', tags: ['Taxes', 'Finance', 'Software'], category: 'Finance' },

    // Development & Tech
    { id: 'github', name: 'GitHub', url: 'https://www.github.com', icon: '🐙', description: 'The largest platform for code hosting, collaboration, and open-source projects.', tags: ['Development', 'Code', 'Collaboration'], category: 'Development' },
    { id: 'stackoverflow', name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '📋', description: 'A question-and-answer site for programmers and technical professionals.', tags: ['Development', 'Learning', 'Community'], category: 'Development' },
    { id: 'cloudflare', name: 'Cloudflare', url: 'https://www.cloudflare.com', icon: '🛡️', description: 'Provides security, performance, and infrastructure for websites.', tags: ['Security', 'Performance', 'Web'], category: 'Development' },
    { id: 'openai', name: 'OpenAI', url: 'https://www.openai.com', icon: '🤖', description: 'AI research and deployment platform behind ChatGPT and advanced models.', tags: ['AI', 'Research', 'Technology'], category: 'Development' },
    { id: 'digitalocean', name: 'DigitalOcean', url: 'https://www.digitalocean.com', icon: '🌊', description: 'Cloud hosting for developers and startups.', tags: ['Cloud', 'Hosting', 'Developers'], category: 'Development' },
    { id: 'aws', name: 'AWS', url: 'https://aws.amazon.com', icon: '☁️', description: 'The world\'s largest cloud infrastructure platform.', tags: ['Cloud', 'Infrastructure', 'Enterprise'], category: 'Development' },
    { id: 'heroku', name: 'Heroku', url: 'https://www.heroku.com', icon: '🟣', description: 'Platform-as-a-service for deploying applications.', tags: ['Development', 'Cloud', 'SaaS'], category: 'Development' },
    { id: 'devto', name: 'Dev.to', url: 'https://www.dev.to', icon: '👨‍💻', description: 'Community blogging platform for developers.', tags: ['Development', 'Writing', 'Community'], category: 'Development' },
    { id: 'mdn', name: 'MDN Web Docs', url: 'https://developer.mozilla.org', icon: '🦊', description: 'Authoritative documentation for web standards.', tags: ['Web', 'Documentation', 'Development'], category: 'Development' },
    { id: 'w3schools', name: 'W3Schools', url: 'https://www.w3schools.com', icon: '📚', description: 'Web development tutorials and references.', tags: ['Development', 'Web', 'Learning'], category: 'Development' },

    // Creative & Design
    { id: 'canva', name: 'Canva', url: 'https://www.canva.com', icon: '🎨', description: 'An easy-to-use online design platform for graphics and content creation.', tags: ['Design', 'Creativity', 'Tools'], category: 'Creative' },
    { id: 'adobe', name: 'Adobe', url: 'https://www.adobe.com', icon: '🖌️', description: 'Creative and professional software for design, video, and documents.', tags: ['Creativity', 'Software', 'Design'], category: 'Creative' },
    { id: 'wordpress', name: 'WordPress', url: 'https://www.wordpress.com', icon: '🌍', description: 'A platform powering millions of websites and blogs worldwide.', tags: ['Websites', 'Blogging', 'CMS'], category: 'Creative' },
    { id: 'medium', name: 'Medium', url: 'https://www.medium.com', icon: '✍️', description: 'A long-form writing platform for articles, insights, and thought leadership.', tags: ['Writing', 'Publishing', 'Ideas'], category: 'Creative' },
    { id: 'shopify', name: 'Shopify', url: 'https://www.shopify.com', icon: '🛍️', description: 'E-commerce platform for building online stores.', tags: ['E-commerce', 'Business', 'SaaS'], category: 'Creative' },
    { id: 'squarespace', name: 'Squarespace', url: 'https://www.squarespace.com', icon: '◼️', description: 'Website builder for businesses and creators.', tags: ['Websites', 'Design', 'Business'], category: 'Creative' },
    { id: 'wix', name: 'Wix', url: 'https://www.wix.com', icon: '🌐', description: 'Drag-and-drop website creation platform.', tags: ['Websites', 'No-Code', 'Design'], category: 'Creative' },
    { id: 'weebly', name: 'Weebly', url: 'https://www.weebly.com', icon: '🔧', description: 'Simple website builder for small businesses.', tags: ['Websites', 'Business', 'CMS'], category: 'Creative' },
    { id: 'substack', name: 'Substack', url: 'https://www.substack.com', icon: '📬', description: 'Email newsletter and publishing platform.', tags: ['Writing', 'Publishing', 'Email'], category: 'Creative' },

    // Hosting & Domains
    { id: 'godaddy', name: 'GoDaddy', url: 'https://www.godaddy.com', icon: '🌐', description: 'Domain registration and web hosting services.', tags: ['Domains', 'Hosting', 'Web'], category: 'Hosting' },
    { id: 'namecheap', name: 'Namecheap', url: 'https://www.namecheap.com', icon: '💲', description: 'Affordable domains, hosting, and security tools.', tags: ['Domains', 'Hosting', 'Security'], category: 'Hosting' },

    // Education & Learning
    { id: 'coursera', name: 'Coursera', url: 'https://www.coursera.org', icon: '🎓', description: 'Online learning platform offering courses from top institutions.', tags: ['Education', 'Learning', 'Skills'], category: 'Education' },
    { id: 'udemy', name: 'Udemy', url: 'https://www.udemy.com', icon: '📖', description: 'A marketplace for practical online courses across many fields.', tags: ['Learning', 'Courses', 'Skills'], category: 'Education' },
    { id: 'khanacademy', name: 'Khan Academy', url: 'https://www.khanacademy.org', icon: '🎓', description: 'Free educational platform covering core subjects.', tags: ['Education', 'Learning', 'Free'], category: 'Education' },
    { id: 'duolingo', name: 'Duolingo', url: 'https://www.duolingo.com', icon: '🦉', description: 'Language learning platform with gamification.', tags: ['Education', 'Languages', 'Learning'], category: 'Education' },
    { id: 'codecademy', name: 'Codecademy', url: 'https://www.codecademy.com', icon: '💻', description: 'Interactive coding education platform.', tags: ['Coding', 'Education', 'Skills'], category: 'Education' },

    // Jobs & Careers
    { id: 'indeed', name: 'Indeed', url: 'https://www.indeed.com', icon: '👔', description: 'A global job search engine connecting employers and candidates.', tags: ['Jobs', 'Careers', 'Employment'], category: 'Careers' },
    { id: 'glassdoor', name: 'Glassdoor', url: 'https://www.glassdoor.com', icon: '🏢', description: 'Company reviews, salaries, and career insights platform.', tags: ['Careers', 'Reviews', 'Jobs'], category: 'Careers' },

    // Freelancing
    { id: 'fiverr', name: 'Fiverr', url: 'https://www.fiverr.com', icon: '🎯', description: 'Freelance services marketplace.', tags: ['Freelancing', 'Services', 'Marketplace'], category: 'Freelancing' },
    { id: 'upwork', name: 'Upwork', url: 'https://www.upwork.com', icon: '💼', description: 'Platform connecting freelancers with businesses.', tags: ['Freelancing', 'Jobs', 'Remote'], category: 'Freelancing' },
    { id: 'freelancer', name: 'Freelancer', url: 'https://www.freelancer.com', icon: '🖥️', description: 'Global freelance job marketplace.', tags: ['Freelancing', 'Work', 'Online'], category: 'Freelancing' },

    // Crowdfunding & Creators
    { id: 'patreon', name: 'Patreon', url: 'https://www.patreon.com', icon: '🎨', description: 'Membership platform for creators to earn recurring income.', tags: ['Creators', 'Monetization', 'Community'], category: 'Creators' },
    { id: 'kickstarter', name: 'Kickstarter', url: 'https://www.kickstarter.com', icon: '🚀', description: 'Crowdfunding platform for creative projects.', tags: ['Crowdfunding', 'Startups', 'Creativity'], category: 'Creators' },
    { id: 'indiegogo', name: 'Indiegogo', url: 'https://www.indiegogo.com', icon: '💡', description: 'Crowdfunding for products, tech, and innovation.', tags: ['Crowdfunding', 'Innovation', 'Startups'], category: 'Creators' },
    { id: 'producthunt', name: 'Product Hunt', url: 'https://www.producthunt.com', icon: '🔥', description: 'Daily launch platform for new tech products.', tags: ['Startups', 'Tech', 'Discovery'], category: 'Creators' },

    // Travel & Hospitality
    { id: 'booking', name: 'Booking.com', url: 'https://www.booking.com', icon: '🏨', description: 'Travel booking platform for hotels and accommodations.', tags: ['Travel', 'Booking', 'Tourism'], category: 'Travel' },
    { id: 'airbnb', name: 'Airbnb', url: 'https://www.airbnb.com', icon: '🏠', description: 'A marketplace for short-term stays and experiences.', tags: ['Travel', 'Marketplace', 'Hospitality'], category: 'Travel' },
    { id: 'tripadvisor', name: 'TripAdvisor', url: 'https://www.tripadvisor.com', icon: '🦉', description: 'Travel reviews and booking insights.', tags: ['Travel', 'Reviews', 'Tourism'], category: 'Travel' },
    { id: 'expedia', name: 'Expedia', url: 'https://www.expedia.com', icon: '✈️', description: 'Online travel booking for flights and hotels.', tags: ['Travel', 'Booking', 'Tourism'], category: 'Travel' },

    // Real Estate
    { id: 'zillow', name: 'Zillow', url: 'https://www.zillow.com', icon: '🏡', description: 'Real estate listings and market data.', tags: ['Real Estate', 'Property', 'Data'], category: 'Real Estate' },
    { id: 'rightmove', name: 'Rightmove', url: 'https://www.rightmove.co.uk', icon: '🏠', description: 'UK property search platform.', tags: ['Real Estate', 'UK', 'Property'], category: 'Real Estate' },

    // Gaming
    { id: 'roblox', name: 'Roblox', url: 'https://www.roblox.com', icon: '🧱', description: 'A platform for creating and playing user-generated games.', tags: ['Gaming', 'Creation', 'Community'], category: 'Gaming' },
    { id: 'steam', name: 'Steam', url: 'https://www.steampowered.com', icon: '🎮', description: 'The largest PC gaming distribution and community platform.', tags: ['Gaming', 'Distribution', 'Community'], category: 'Gaming' },
];

// Category icons and colors
const CATEGORY_META: Record<string, { icon: string; color: string; gradient: string }> = {
    'Search & Tools': { icon: '🔍', color: '#4285f4', gradient: 'linear-gradient(135deg, #4285f4, #34a853)' },
    'Social': { icon: '👥', color: '#e91e63', gradient: 'linear-gradient(135deg, #e91e63, #9c27b0)' },
    'Messaging': { icon: '💬', color: '#25D366', gradient: 'linear-gradient(135deg, #25D366, #128C7E)' },
    'Entertainment': { icon: '🎬', color: '#ff5722', gradient: 'linear-gradient(135deg, #ff5722, #ff9800)' },
    'News': { icon: '📰', color: '#607d8b', gradient: 'linear-gradient(135deg, #607d8b, #455a64)' },
    'Shopping': { icon: '🛒', color: '#ff9800', gradient: 'linear-gradient(135deg, #ff9800, #ffc107)' },
    'Business': { icon: '💼', color: '#2196f3', gradient: 'linear-gradient(135deg, #2196f3, #03a9f4)' },
    'Productivity': { icon: '📝', color: '#00bcd4', gradient: 'linear-gradient(135deg, #00bcd4, #009688)' },
    'Work Tools': { icon: '🔧', color: '#5c6bc0', gradient: 'linear-gradient(135deg, #5c6bc0, #3f51b5)' },
    'Cloud': { icon: '☁️', color: '#03a9f4', gradient: 'linear-gradient(135deg, #03a9f4, #00bcd4)' },
    'Finance': { icon: '💰', color: '#4caf50', gradient: 'linear-gradient(135deg, #4caf50, #8bc34a)' },
    'Development': { icon: '💻', color: '#673ab7', gradient: 'linear-gradient(135deg, #673ab7, #3f51b5)' },
    'Creative': { icon: '🎨', color: '#e91e63', gradient: 'linear-gradient(135deg, #e91e63, #ff5722)' },
    'Hosting': { icon: '🌐', color: '#795548', gradient: 'linear-gradient(135deg, #795548, #a1887f)' },
    'Education': { icon: '🎓', color: '#ff7043', gradient: 'linear-gradient(135deg, #ff7043, #ff5722)' },
    'Careers': { icon: '👔', color: '#3f51b5', gradient: 'linear-gradient(135deg, #3f51b5, #5c6bc0)' },
    'Freelancing': { icon: '🖥️', color: '#26a69a', gradient: 'linear-gradient(135deg, #26a69a, #00897b)' },
    'Creators': { icon: '🎨', color: '#f06292', gradient: 'linear-gradient(135deg, #f06292, #e91e63)' },
    'Travel': { icon: '✈️', color: '#009688', gradient: 'linear-gradient(135deg, #009688, #4db6ac)' },
    'Real Estate': { icon: '🏡', color: '#8d6e63', gradient: 'linear-gradient(135deg, #8d6e63, #a1887f)' },
    'Gaming': { icon: '🎮', color: '#9c27b0', gradient: 'linear-gradient(135deg, #9c27b0, #7b1fa2)' },
    'Lifestyle': { icon: '🌸', color: '#f06292', gradient: 'linear-gradient(135deg, #f06292, #ec407a)' },
    'KDS Ecosystem': { icon: '💠', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
};

interface AppStoreProps {
    installedApps: string[];
    onInstallApp: (app: StoreApp) => void;
    onUninstallApp: (appId: string) => void;
    onOpenApp: (app: StoreApp) => void;
}

export const AppStore: React.FC<AppStoreProps> = ({ installedApps, onInstallApp, onUninstallApp, onOpenApp }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedApp, setSelectedApp] = useState<StoreApp | null>(null);

    // Get unique categories
    const categories = [...new Set(STORE_APPS.map(app => app.category))];

    // Filter apps
    const filteredApps = STORE_APPS.filter(app => {
        const matchesSearch = searchQuery === '' ||
            app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === null || app.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const isInstalled = (appId: string) => installedApps.includes(appId);

    return (
        <div className="app-store">
            {/* Header */}
            <div className="store-header">
                <div className="store-title">
                    <span className="store-icon">🏪</span>
                    <div>
                        <h1>App Store</h1>
                        <p>Discover and install apps for your desktop</p>
                    </div>
                </div>
                <div className="store-search">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search apps, categories, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="store-body">
                {/* Sidebar */}
                <div className="store-sidebar">
                    <div className="sidebar-section">
                        <h3>Categories</h3>
                        <div
                            className={`sidebar-item ${selectedCategory === null ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(null)}
                        >
                            <span>🌐</span>
                            <span>All Apps</span>
                            <span className="count">{STORE_APPS.length}</span>
                        </div>
                        {categories.map(category => (
                            <div
                                key={category}
                                className={`sidebar-item ${selectedCategory === category ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(category)}
                                style={{ '--category-color': CATEGORY_META[category]?.color || '#666' } as React.CSSProperties}
                            >
                                <span>{CATEGORY_META[category]?.icon || '📁'}</span>
                                <span>{category}</span>
                                <span className="count">{STORE_APPS.filter(a => a.category === category).length}</span>
                            </div>
                        ))}
                    </div>

                    <div className="sidebar-section">
                        <h3>Installed</h3>
                        <div className="installed-count">
                            <span className="big-number">{installedApps.length}</span>
                            <span>apps active</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="store-content">
                    {selectedApp ? (
                        // App Detail View
                        <div className="app-detail">
                            <button className="back-btn" onClick={() => setSelectedApp(null)}>
                                ← Back to Apps
                            </button>
                            <div className="detail-header">
                                <ModernIcon
                                    iconName={selectedApp.icon}
                                    size={120}
                                    gradient={selectedApp.gradient || CATEGORY_META[selectedApp.category]?.gradient}
                                />
                                <div className="detail-info">
                                    <h1>{selectedApp.name}</h1>
                                    <div className="detail-category">{selectedApp.category}</div>
                                    <div className="detail-tags">
                                        {selectedApp.tags.map(tag => (
                                            <span key={tag} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="detail-actions">
                                    {isInstalled(selectedApp.id) ? (
                                        <>
                                            <button className="btn open" onClick={() => onOpenApp(selectedApp)}>
                                                Open App
                                            </button>
                                            <button className="btn uninstall" onClick={() => onUninstallApp(selectedApp.id)}>
                                                Remove
                                            </button>
                                        </>
                                    ) : (
                                        <button className="btn install" onClick={() => onInstallApp(selectedApp)}>
                                            + Add to Desktop
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="detail-description">
                                <h2>About</h2>
                                <p>{selectedApp.description}</p>
                                <div className="detail-url">
                                    <span>🔗</span>
                                    <a href={selectedApp.url} target="_blank" rel="noopener noreferrer">{selectedApp.url}</a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // App Grid View
                        <>
                            <div className="content-header">
                                <h2>{selectedCategory || 'All Apps'}</h2>
                                <span className="result-count">{filteredApps.length} apps</span>
                            </div>
                            <div className="app-grid">
                                {filteredApps.map(app => (
                                    <div
                                        key={app.id}
                                        className={`app-card ${isInstalled(app.id) ? 'installed' : ''}`}
                                        onClick={() => setSelectedApp(app)}
                                    >
                                        <ModernIcon
                                            iconName={app.icon}
                                            size={80}
                                            gradient={app.gradient || CATEGORY_META[app.category]?.gradient}
                                        />
                                        {isInstalled(app.id) && <span className="installed-badge">✓</span>}
                                        <div className="app-card-info">
                                            <h3>{app.name}</h3>
                                            <p>{app.description.substring(0, 60)}...</p>
                                            <div className="app-card-tags">
                                                {app.tags.slice(0, 2).map(tag => (
                                                    <span key={tag} className="mini-tag">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="app-card-action" onClick={(e) => {
                                            e.stopPropagation();
                                            if (isInstalled(app.id)) {
                                                onOpenApp(app);
                                            } else {
                                                onInstallApp(app);
                                            }
                                        }}>
                                            {isInstalled(app.id) ? 'Open' : '+ Add'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppStore;

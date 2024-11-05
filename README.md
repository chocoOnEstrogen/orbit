# Orbit Discord Bot

Orbit is a feature-rich Discord bot designed to enhance community server functionality with various utility, moderation, and fun commands.

## Features

### Utility Commands
- `/ping` - Check bot latency
- `/serverinfo` - Get detailed server information
- `/userinfo` - View user profile details
- `/avatar` - Display user's avatar
- `/roleinfo` - Get information about a role
- `/giveaway` - Create and manage giveaways
- `/remind` - Set personal reminders
- `/poll` - Create interactive polls

### Moderation Commands
- `/ban` - Ban users from the server
- `/timeout` - Temporarily timeout users

### Fun Commands
- `/8ball` - Ask the magic 8-ball a question
- `/joke` - Get random jokes (Programming/General/Pun)
- `/random` - Generate random numbers
- `/echo` - Make the bot repeat your message
- `/booru` - Search for images across various booru sites (NSFW)
- `/play-sound` - Play audio files in voice channels

### Services
- **Giveaway Service**: Automatically manages and ends giveaways
- **Reminder Service**: Handles scheduled reminders
- **Bluesky Service**: Cross-posts from Bluesky to Discord (configurable)
- **HTTP Server**: Provides API endpoints for bot functionality

## Technical Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Database**: Supabase
- **Dependencies**:
  - discord.js
  - @supabase/supabase-js
  - express
  - @atproto/api
  - Various utility packages

## Setup

1. Clone the repository:

```bash
git clone https://github.com/chocoOnEstrogen/orbit.git
cd orbit
```

2. Install dependencies:

```bash
npm install
```

3. Copy `.env.sample` to `.env` and fill in the required values:

```env
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_guild_id
DISCORD_CLIENT_ID=your_client_id
NODE_ENV=development
BLUESKY_IDENTIFIER=your_bluesky_handle
BLUESKY_PASSWORD=your_bluesky_password
BLUESKY_FEED_INTERVAL=60000
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE=your_supabase_service_role
SUPABASE_URL=your_supabase_url
```

4. Set up the database:
- Execute the SQL scripts in `supabase/data.sql` in your Supabase project

5. Build the project:

```bash
npm run build
```

6. Deploy commands:

```bash
npm run deploy-commands
```

7. Start the bot:

```bash
npm start
```

For development:

```bash
npm run dev
```

## Development

### Project Structure
- `src/commands/` - Command implementations
- `src/events/` - Discord event handlers
- `src/services/` - Background services
- `src/configs/` - Configuration files
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions
- `src/server/` - HTTP server implementation

### Adding New Commands
1. Create a new file in the appropriate category under `src/commands/`
2. Implement the command using the Command type interface
3. Run `npm run deploy-commands` to register new commands

### Code Style
The project uses ESLint and Prettier for code formatting:

```bash
npm run lint     # Check for issues
npm run lint:fix # Fix issues
npm run format   # Format code
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC License - See LICENSE file for details

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/chocoOnEstrogen/orbit/issues).
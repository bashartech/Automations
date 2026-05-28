const axios = require('axios');
require('dotenv').config();

class WebSearchService {
  constructor() {
    this.tavilyApiKey = process.env.TAVILY_API_KEY;
    this.serperApiKey = process.env.SERPER_API_KEY;
    this.enabled = !!(this.tavilyApiKey || this.serperApiKey);

    if (!this.enabled) {
      console.warn('⚠️  No search API key found. Web search disabled.');
    }
  }

  // Search using Tavily (recommended)
  async searchWithTavily(query, maxResults = 5) {
    try {
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: this.tavilyApiKey,
        query: query,
        max_results: maxResults,
        search_depth: 'basic',
        include_answer: true
      });

      return {
        answer: response.data.answer,
        results: response.data.results.map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.content
        }))
      };
    } catch (error) {
      console.error('Tavily search error:', error.message);
      return null;
    }
  }

  // Search using Serper (alternative)
  async searchWithSerper(query, maxResults = 5) {
    try {
      const response = await axios.post('https://google.serper.dev/search', {
        q: query,
        num: maxResults
      }, {
        headers: {
          'X-API-KEY': this.serperApiKey,
          'Content-Type': 'application/json'
        }
      });

      const organic = response.data.organic || [];

      return {
        answer: response.data.answerBox?.answer || null,
        results: organic.map(r => ({
          title: r.title,
          url: r.link,
          snippet: r.snippet
        }))
      };
    } catch (error) {
      console.error('Serper search error:', error.message);
      return null;
    }
  }

  // Main search method
  async search(query) {
    if (!this.enabled) {
      return {
        success: false,
        message: "Web search is currently disabled. Please add TAVILY_API_KEY or SERPER_API_KEY to .env file."
      };
    }

    try {
      let result = null;

      // Try Tavily first
      if (this.tavilyApiKey) {
        result = await this.searchWithTavily(query);
      }

      // Fallback to Serper
      if (!result && this.serperApiKey) {
        result = await this.searchWithSerper(query);
      }

      if (!result) {
        return {
          success: false,
          message: "Search failed. Please try again."
        };
      }

      // Format response
      let response = '🔍 *Search Results*\n\n';

      if (result.answer) {
        response += `📌 *Quick Answer:*\n${result.answer}\n\n`;
      }

      if (result.results && result.results.length > 0) {
        response += '*Top Results:*\n';
        result.results.slice(0, 3).forEach((r, i) => {
          response += `\n${i + 1}. *${r.title}*\n`;
          response += `   ${r.snippet}\n`;
          response += `   🔗 ${r.url}\n`;
        });
      }

      return {
        success: true,
        message: response,
        data: result
      };
    } catch (error) {
      console.error('Search error:', error.message);
      return {
        success: false,
        message: "An error occurred while searching. Please try again."
      };
    }
  }

  // Quick search (just get answer)
  async quickSearch(query) {
    const result = await this.search(query);

    if (result.success && result.data?.answer) {
      return result.data.answer;
    }

    if (result.success && result.data?.results?.length > 0) {
      return result.data.results[0].snippet;
    }

    return "No results found.";
  }
}

module.exports = new WebSearchService();

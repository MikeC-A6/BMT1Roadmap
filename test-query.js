const fetch = require('node-fetch');

async function testQuery() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error("GITHUB_TOKEN environment variable is not set");
    process.exit(1);
  }
  
  const searchQuery = 'repo:department-of-veterans-affairs/va.gov-team is:issue is:open label:"benefits-management-tools" label:"bmt-2025" label:"bmt-team-1"';
  
  const query = `
    query BmtAllThree($cursor: String, $searchQuery: String!) {
      search(
        type: ISSUE
        first: 100
        after: $cursor
        query: $searchQuery
      ) {
        edges {
          node {
            ... on Issue {
              number
              title
              url
              labels(first: 10) {
                nodes { name }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;
  
  const variables = {
    cursor: null,
    searchQuery: searchQuery
  };
  
  console.log("Query:", query);
  console.log("Variables:", JSON.stringify(variables, null, 2));
  
  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
    } else if (data.data?.search?.edges) {
      console.log(`Found ${data.data.search.edges.length} issues`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testQuery(); 
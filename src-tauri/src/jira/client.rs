use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use reqwest::Client;

use super::models::{JiraConnectionTest, JiraWorklogRequest, JiraWorklogResponse};

pub struct JiraClient {
    client: Client,
    base_url: String,
    auth_header: String,
}

impl JiraClient {
    pub fn new(base_url: &str, email: &str, api_token: &str) -> Self {
        let credentials = format!("{email}:{api_token}");
        let auth_header = format!("Basic {}", BASE64.encode(credentials));
        Self {
            client: Client::new(),
            base_url: base_url.trim_end_matches('/').to_string(),
            auth_header,
        }
    }

    pub async fn add_worklog(
        &self,
        issue_key: &str,
        request: &JiraWorklogRequest,
    ) -> Result<JiraWorklogResponse, String> {
        let url = format!(
            "{}/rest/api/3/issue/{}/worklog",
            self.base_url, issue_key
        );

        let response = self
            .client
            .post(&url)
            .header("Authorization", &self.auth_header)
            .header("Content-Type", "application/json")
            .json(request)
            .send()
            .await
            .map_err(|e| format!("HTTP request failed: {e}"))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "no body".into());
            return Err(format!("Jira API error ({status}): {body}"));
        }

        response
            .json::<JiraWorklogResponse>()
            .await
            .map_err(|e| format!("Failed to parse Jira response: {e}"))
    }

    pub async fn test_connection(&self) -> JiraConnectionTest {
        let url = format!("{}/rest/api/3/myself", self.base_url);

        match self
            .client
            .get(&url)
            .header("Authorization", &self.auth_header)
            .send()
            .await
        {
            Ok(resp) if resp.status().is_success() => JiraConnectionTest {
                success: true,
                message: "Connection successful".into(),
            },
            Ok(resp) => JiraConnectionTest {
                success: false,
                message: format!("Jira returned status {}", resp.status()),
            },
            Err(e) => JiraConnectionTest {
                success: false,
                message: format!("Connection failed: {e}"),
            },
        }
    }
}

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct JiraWorklogRequest {
    #[serde(rename = "timeSpentSeconds")]
    pub time_spent_seconds: i64,
    pub comment: Option<JiraDocumentBody>,
    pub started: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JiraDocumentBody {
    pub version: i32,
    #[serde(rename = "type")]
    pub doc_type: String,
    pub content: Vec<JiraDocumentContent>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JiraDocumentContent {
    #[serde(rename = "type")]
    pub content_type: String,
    pub content: Vec<JiraTextNode>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JiraTextNode {
    #[serde(rename = "type")]
    pub text_type: String,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JiraWorklogResponse {
    pub id: String,
    #[serde(rename = "timeSpentSeconds")]
    pub time_spent_seconds: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JiraConnectionTest {
    pub success: bool,
    pub message: String,
}

impl JiraWorklogRequest {
    pub fn new(seconds: i64, started: Option<String>, comment: Option<String>) -> Self {
        let comment_body = comment.map(|text| JiraDocumentBody {
            version: 1,
            doc_type: "doc".into(),
            content: vec![JiraDocumentContent {
                content_type: "paragraph".into(),
                content: vec![JiraTextNode {
                    text_type: "text".into(),
                    text,
                }],
            }],
        });

        Self {
            time_spent_seconds: seconds,
            comment: comment_body,
            started,
        }
    }
}

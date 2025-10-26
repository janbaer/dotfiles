#!/usr/bin/env python3

"""
Forgejo Pull Request API Client
Provides comprehensive API operations for Forgejo PR management
"""

import json
import os
import sys
import argparse
import requests
from datetime import datetime
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin


class ForgejoClient:
    """Client for Forgejo API operations"""
    
    def __init__(self, base_url: str, token: str):
        """
        Initialize Forgejo client
        
        Args:
            base_url: Forgejo instance URL (e.g., https://forgejo.example.com)
            token: Personal access token
        """
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api/v1"
        self.headers = {
            "Authorization": f"token {token}",
            "Content-Type": "application/json"
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def create_pull_request(
        self,
        repo: str,
        title: str,
        head: str,
        base: str,
        body: Optional[str] = None,
        assignees: Optional[List[str]] = None,
        labels: Optional[List[str]] = None,
        milestone: Optional[int] = None,
        due_date: Optional[str] = None,
        draft: bool = False
    ) -> Dict[str, Any]:
        """
        Create a new pull request
        
        Args:
            repo: Repository in format "owner/repo"
            title: PR title
            head: Source branch
            base: Target branch
            body: PR description
            assignees: List of assignee usernames
            labels: List of label names
            milestone: Milestone ID
            due_date: Due date in ISO format
            draft: Create as draft PR
        
        Returns:
            Created PR data
        """
        owner, repo_name = repo.split('/')
        url = f"{self.api_url}/repos/{owner}/{repo_name}/pulls"
        
        # Build request data
        data = {
            "title": title,
            "head": head,
            "base": base,
            "body": body or "",
            "draft": draft
        }
        
        if milestone:
            data["milestone"] = milestone
        
        if due_date:
            data["due_date"] = due_date
        
        # Create PR
        response = self.session.post(url, json=data)
        response.raise_for_status()
        pr_data = response.json()
        
        # Add assignees if specified
        if assignees:
            self._update_assignees(repo, pr_data["number"], assignees)
        
        # Add labels if specified
        if labels:
            self._add_labels(repo, pr_data["number"], labels)
        
        return pr_data
    
    def update_pull_request(
        self,
        repo: str,
        pr_number: int,
        title: Optional[str] = None,
        body: Optional[str] = None,
        state: Optional[str] = None,
        base: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update an existing pull request"""
        owner, repo_name = repo.split('/')
        url = f"{self.api_url}/repos/{owner}/{repo_name}/pulls/{pr_number}"
        
        data = {}
        if title:
            data["title"] = title
        if body:
            data["body"] = body
        if state:
            data["state"] = state
        if base:
            data["base"] = base
        
        response = self.session.patch(url, json=data)
        response.raise_for_status()
        return response.json()
    
    def list_pull_requests(
        self,
        repo: str,
        state: str = "open",
        sort: str = "created",
        direction: str = "desc"
    ) -> List[Dict[str, Any]]:
        """List pull requests for a repository"""
        owner, repo_name = repo.split('/')
        url = f"{self.api_url}/repos/{owner}/{repo_name}/pulls"
        
        params = {
            "state": state,
            "sort": sort,
            "direction": direction
        }
        
        response = self.session.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_pull_request(self, repo: str, pr_number: int) -> Dict[str, Any]:
        """Get details of a specific pull request"""
        owner, repo_name = repo.split('/')
        url = f"{self.api_url}/repos/{owner}/{repo_name}/pulls/{pr_number}"
        
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()
    
    def merge_pull_request(
        self,
        repo: str,
        pr_number: int,
        merge_method: str = "merge",
        merge_title: Optional[str] = None,
        merge_message: Optional[str] = None,
        delete_branch_after_merge: bool = False
    ) -> Dict[str, Any]:
        """
        Merge a pull request
        
        Args:
            repo: Repository in format "owner/repo"
            pr_number: PR number
            merge_method: merge, rebase, rebase-merge, or squash
            merge_title: Custom merge commit title
            merge_message: Custom merge commit message
            delete_branch_after_merge: Delete source branch after merge
        
        Returns:
            Merge result data
        """
        owner, repo_name = repo.split('/')
        url = f"{self.api_url}/repos/{owner}/{repo_name}/pulls/{pr_number}/merge"
        
        data = {
            "Do": merge_method,
            "delete_branch_after_merge": delete_branch_after_merge
        }
        
        if merge_title:
            data["MergeTitleField"] = merge_title
        
        if merge_message:
            data["MergeMessageField"] = merge_message
        
        response = self.session.post(url, json=data)
        response.raise_for_status()
        return response.json()
    
    def enable_auto_merge(
        self,
        repo: str,
        pr_number: int,
        merge_method: str = "squash",
        delete_branch: bool = True
    ) -> bool:
        """Enable auto-merge for a pull request"""
        owner, repo_name = repo.split('/')
        url = f"{self.api_url}/repos/{owner}/{repo_name}/pulls/{pr_number}/merge"
        
        data = {
            "auto_merge": True,
            "auto_merge_method": merge_method,
            "delete_branch_after_merge": delete_branch
        }
        
        response = self.session.patch(url, json=data)
        return response.status_code == 200
    
    def add_reviewer(self, repo: str, pr_number: int, reviewer: str) -> bool:
        """Add a reviewer to a pull request"""
        owner, repo_name = repo.split('/')
        url = f"{self.api_url}/repos/{owner}/{repo_name}/pulls/{pr_number}/requested_reviewers"
        
        data = {"reviewers": [reviewer]}
        response = self.session.post(url, json=data)
        return response.status_code in [200, 201]
    
    def _update_assignees(self, repo: str, pr_number: int, assignees: List[str]):
        """Update assignees for a pull request"""
        owner, repo_name = repo.split('/')
        url = f"{self.api_url}/repos/{owner}/{repo_name}/issues/{pr_number}"
        
        data = {"assignees": assignees}
        self.session.patch(url, json=data)
    
    def _add_labels(self, repo: str, pr_number: int, labels: List[str]):
        """Add labels to a pull request"""
        owner, repo_name = repo.split('/')
        url = f"{self.api_url}/repos/{owner}/{repo_name}/issues/{pr_number}/labels"
        
        # Get label IDs
        label_ids = []
        for label_name in labels:
            label_url = f"{self.api_url}/repos/{owner}/{repo_name}/labels"
            response = self.session.get(label_url)
            if response.status_code == 200:
                for label in response.json():
                    if label["name"] == label_name:
                        label_ids.append(label["id"])
                        break
        
        if label_ids:
            data = {"labels": label_ids}
            self.session.post(url, json=data)
    
    def create_pr_comment(self, repo: str, pr_number: int, comment: str) -> Dict[str, Any]:
        """Add a comment to a pull request"""
        owner, repo_name = repo.split('/')
        url = f"{self.api_url}/repos/{owner}/{repo_name}/issues/{pr_number}/comments"
        
        data = {"body": comment}
        response = self.session.post(url, json=data)
        response.raise_for_status()
        return response.json()
    
    def get_pr_files(self, repo: str, pr_number: int) -> List[Dict[str, Any]]:
        """Get list of files changed in a pull request"""
        owner, repo_name = repo.split('/')
        url = f"{self.api_url}/repos/{owner}/{repo_name}/pulls/{pr_number}/files"
        
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()
    
    def get_pr_commits(self, repo: str, pr_number: int) -> List[Dict[str, Any]]:
        """Get list of commits in a pull request"""
        owner, repo_name = repo.split('/')
        url = f"{self.api_url}/repos/{owner}/{repo_name}/pulls/{pr_number}/commits"
        
        response = self.session.get(url)
        response.raise_for_status()
        return response.json()
    
    def check_pr_mergeable(self, repo: str, pr_number: int) -> Dict[str, Any]:
        """Check if a pull request is mergeable"""
        pr_data = self.get_pull_request(repo, pr_number)
        
        return {
            "mergeable": pr_data.get("mergeable", False),
            "has_conflicts": pr_data.get("has_conflicts", False),
            "state": pr_data.get("state", "unknown")
        }


def main():
    """Command-line interface for Forgejo PR operations"""
    parser = argparse.ArgumentParser(description="Forgejo PR API Client")
    parser.add_argument("--url", required=True, help="Forgejo instance URL")
    parser.add_argument("--token", help="API token (or set FORGEJO_TOKEN env var)")
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Create PR command
    create_parser = subparsers.add_parser("create", help="Create a pull request")
    create_parser.add_argument("--repo", required=True, help="Repository (owner/repo)")
    create_parser.add_argument("--title", required=True, help="PR title")
    create_parser.add_argument("--head", required=True, help="Source branch")
    create_parser.add_argument("--base", required=True, help="Target branch")
    create_parser.add_argument("--body", help="PR description")
    create_parser.add_argument("--assignees", help="Comma-separated assignees")
    create_parser.add_argument("--labels", help="Comma-separated labels")
    create_parser.add_argument("--draft", action="store_true", help="Create as draft")
    
    # List PRs command
    list_parser = subparsers.add_parser("list", help="List pull requests")
    list_parser.add_argument("--repo", required=True, help="Repository (owner/repo)")
    list_parser.add_argument("--state", default="open", choices=["open", "closed", "all"])
    
    # Merge PR command
    merge_parser = subparsers.add_parser("merge", help="Merge a pull request")
    merge_parser.add_argument("--repo", required=True, help="Repository (owner/repo)")
    merge_parser.add_argument("--number", type=int, required=True, help="PR number")
    merge_parser.add_argument("--method", default="merge", 
                             choices=["merge", "squash", "rebase", "rebase-merge"])
    merge_parser.add_argument("--delete-branch", action="store_true", 
                             help="Delete branch after merge")
    
    args = parser.parse_args()
    
    # Get token from args or environment
    token = args.token or os.environ.get("FORGEJO_TOKEN")
    if not token:
        print("Error: API token required (--token or FORGEJO_TOKEN env var)")
        sys.exit(1)
    
    # Initialize client
    client = ForgejoClient(args.url, token)
    
    # Execute command
    try:
        if args.command == "create":
            assignees = args.assignees.split(",") if args.assignees else None
            labels = args.labels.split(",") if args.labels else None
            
            pr = client.create_pull_request(
                repo=args.repo,
                title=args.title,
                head=args.head,
                base=args.base,
                body=args.body,
                assignees=assignees,
                labels=labels,
                draft=args.draft
            )
            
            print(f"✓ Created PR #{pr['number']}: {pr['title']}")
            print(f"  URL: {pr['html_url']}")
            
        elif args.command == "list":
            prs = client.list_pull_requests(args.repo, state=args.state)
            
            if not prs:
                print(f"No {args.state} pull requests found")
            else:
                print(f"Pull Requests ({args.state}):")
                for pr in prs:
                    print(f"  #{pr['number']}: {pr['title']}")
                    print(f"    Author: {pr['user']['login']}")
                    print(f"    Branch: {pr['head']['ref']} -> {pr['base']['ref']}")
                    
        elif args.command == "merge":
            result = client.merge_pull_request(
                repo=args.repo,
                pr_number=args.number,
                merge_method=args.method,
                delete_branch_after_merge=args.delete_branch
            )
            
            print(f"✓ Merged PR #{args.number} using {args.method} method")
            
        else:
            parser.print_help()
            
    except requests.exceptions.RequestException as e:
        print(f"Error: API request failed - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
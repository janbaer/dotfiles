#!/usr/bin/env python3

"""
PR Template Application Script
Generates PR descriptions from templates and extracts metadata
"""

import os
import re
import sys
import json
import argparse
from typing import Dict, List, Optional, Tuple
from datetime import datetime


class PRTemplateProcessor:
    """Process and apply PR templates"""
    
    def __init__(self, template_dir: str = "references"):
        """Initialize template processor"""
        self.template_dir = template_dir
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, str]:
        """Load available PR templates"""
        templates = {}
        template_files = {
            "feature": "pr_template_feature.md",
            "bugfix": "pr_template_bugfix.md",
            "hotfix": "pr_template_hotfix.md",
            "docs": "pr_template_docs.md",
            "refactor": "pr_template_refactor.md"
        }
        
        for key, filename in template_files.items():
            path = os.path.join(self.template_dir, filename)
            if os.path.exists(path):
                with open(path, 'r') as f:
                    templates[key] = f.read()
            else:
                # Provide default templates if files don't exist
                templates[key] = self._get_default_template(key)
        
        return templates
    
    def _get_default_template(self, template_type: str) -> str:
        """Get default template for a given type"""
        templates = {
            "feature": """## Description
Brief description of the feature being added.

## Motivation and Context
Why is this change required? What problem does it solve?

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Types of changes
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)

## Checklist
- [ ] My code follows the code style of this project
- [ ] My change requires a change to the documentation
- [ ] I have updated the documentation accordingly
- [ ] I have added tests to cover my changes
- [ ] All new and existing tests passed

## Related Issues
Closes #

## Screenshots (if appropriate)
""",
            "bugfix": """## Description
Brief description of the bug being fixed.

## Root Cause
What caused the bug?

## Solution
How does this fix address the root cause?

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
- [ ] Regression testing

## Types of changes
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] Breaking change (fix that would cause existing functionality to change)

## Checklist
- [ ] My code follows the code style of this project
- [ ] I have added tests to cover the bug fix
- [ ] All new and existing tests passed
- [ ] The fix has been verified in a production-like environment

## Related Issues
Fixes #

## Test Evidence
""",
            "hotfix": """## Critical Issue
**Severity**: 🔴 HIGH / 🟡 MEDIUM / 🟢 LOW
**Environment**: Production / Staging / Development

## Description
Brief description of the critical issue being addressed.

## Impact
Who/what is affected and how?

## Root Cause
What caused the issue?

## Solution
Immediate fix applied:

## Rollback Plan
If this fix causes issues, rollback by:

## Testing
- [ ] Tested in local environment
- [ ] Tested in staging environment
- [ ] Smoke tests passed
- [ ] No regression in critical paths

## Post-Mortem
Link to post-mortem document: 

## Related Issues
Fixes #

## Deployment Notes
Special deployment considerations:
""",
            "docs": """## Description
Summary of documentation changes.

## Types of Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Developer guide
- [ ] README updates
- [ ] Code comments

## Checklist
- [ ] Documentation follows the project style guide
- [ ] Links have been tested and work
- [ ] Code examples have been tested
- [ ] Grammar and spelling have been checked

## Related Issues
Closes #
""",
            "refactor": """## Description
Brief description of the refactoring.

## Motivation
Why is this refactoring needed?

## Changes Made
- List of specific changes
- Architecture modifications
- Performance improvements

## Backwards Compatibility
- [ ] Fully backwards compatible
- [ ] Breaking changes (documented below)

## Performance Impact
- [ ] Performance tests run
- [ ] No performance degradation
- [ ] Performance improved (metrics below)

## Testing
- [ ] Existing tests still pass
- [ ] New tests added for refactored code
- [ ] Integration tests pass

## Related Issues
Relates to #
"""
        }
        return templates.get(template_type, templates["feature"])
    
    def detect_pr_type(self, branch_name: str, commit_messages: List[str]) -> str:
        """Detect PR type from branch name and commit messages"""
        branch_lower = branch_name.lower()
        
        # Check branch prefix
        if branch_lower.startswith(("feature/", "feat/")):
            return "feature"
        elif branch_lower.startswith(("fix/", "bugfix/", "bug/")):
            return "bugfix"
        elif branch_lower.startswith("hotfix/"):
            return "hotfix"
        elif branch_lower.startswith(("docs/", "documentation/")):
            return "docs"
        elif branch_lower.startswith(("refactor/", "refactoring/")):
            return "refactor"
        
        # Check commit message patterns
        for msg in commit_messages:
            msg_lower = msg.lower()
            if msg_lower.startswith(("feat:", "feature:")):
                return "feature"
            elif msg_lower.startswith(("fix:", "bugfix:", "bug:")):
                return "bugfix"
            elif msg_lower.startswith("hotfix:"):
                return "hotfix"
            elif msg_lower.startswith(("docs:", "doc:")):
                return "docs"
            elif msg_lower.startswith("refactor:"):
                return "refactor"
        
        # Default to feature
        return "feature"
    
    def extract_issue_references(self, text: str) -> List[str]:
        """Extract issue references from text"""
        patterns = [
            r'#(\d+)',                    # #123
            r'(?:closes?|fixes?|resolves?)\s+#(\d+)',  # closes #123
            r'(?:issue|bug)\s+#(\d+)',    # issue #123
        ]
        
        issues = set()
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            issues.update(matches)
        
        return sorted(list(issues))
    
    def generate_pr_body(
        self,
        template_type: str,
        title: str,
        branch_name: str,
        commit_messages: List[str],
        custom_fields: Optional[Dict[str, str]] = None
    ) -> Tuple[str, Dict[str, any]]:
        """
        Generate PR body from template
        
        Returns:
            Tuple of (formatted body, metadata dict)
        """
        # Get template
        if template_type not in self.templates:
            template_type = self.detect_pr_type(branch_name, commit_messages)
        
        body = self.templates[template_type]
        
        # Extract issue references
        all_text = title + "\n" + "\n".join(commit_messages)
        issues = self.extract_issue_references(all_text)
        
        # Replace issue placeholders
        if issues:
            body = re.sub(
                r'(Closes?|Fixes?|Relates to)\s+#\s*$',
                f'\\1 #' + ', #'.join(issues),
                body,
                flags=re.MULTILINE | re.IGNORECASE
            )
        
        # Apply custom fields if provided
        if custom_fields:
            for key, value in custom_fields.items():
                placeholder = f"{{{{ {key} }}}}"
                if placeholder in body:
                    body = body.replace(placeholder, value)
        
        # Add commit list if not empty
        if commit_messages:
            commits_section = "\n## Commits\n"
            for msg in commit_messages:
                commits_section += f"- {msg}\n"
            
            # Add before the checklist or at the end
            checklist_pos = body.find("## Checklist")
            if checklist_pos > 0:
                body = body[:checklist_pos] + commits_section + "\n" + body[checklist_pos:]
            else:
                body += commits_section
        
        # Generate metadata
        metadata = {
            "template_type": template_type,
            "issues": issues,
            "generated_at": datetime.now().isoformat(),
            "branch": branch_name,
            "has_breaking_changes": "breaking change" in body.lower()
        }
        
        # Add suggested labels based on template type
        metadata["suggested_labels"] = self._suggest_labels(template_type, body)
        
        # Add suggested reviewers based on changed files (if available)
        metadata["suggested_reviewers"] = self._suggest_reviewers(branch_name)
        
        return body, metadata
    
    def _suggest_labels(self, template_type: str, body: str) -> List[str]:
        """Suggest labels based on template type and content"""
        labels = []
        
        # Type-based labels
        type_labels = {
            "feature": ["enhancement", "feature"],
            "bugfix": ["bug", "fix"],
            "hotfix": ["hotfix", "critical"],
            "docs": ["documentation"],
            "refactor": ["refactoring", "technical-debt"]
        }
        
        labels.extend(type_labels.get(template_type, []))
        
        # Content-based labels
        body_lower = body.lower()
        
        if "breaking change" in body_lower:
            labels.append("breaking-change")
        
        if "security" in body_lower:
            labels.append("security")
        
        if "performance" in body_lower:
            labels.append("performance")
        
        if "test" in body_lower:
            labels.append("needs-testing")
        
        if "wip" in body_lower or "work in progress" in body_lower:
            labels.append("WIP")
        
        return list(set(labels))  # Remove duplicates
    
    def _suggest_reviewers(self, branch_name: str) -> List[str]:
        """Suggest reviewers based on branch or CODEOWNERS"""
        reviewers = []
        
        # Check for CODEOWNERS file
        codeowners_paths = [
            ".github/CODEOWNERS",
            "CODEOWNERS",
            "docs/CODEOWNERS"
        ]
        
        for path in codeowners_paths:
            if os.path.exists(path):
                # Parse CODEOWNERS (simplified)
                with open(path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            parts = line.split()
                            if len(parts) >= 2:
                                # Add owners (remove @ prefix)
                                owners = [o.lstrip('@') for o in parts[1:]]
                                reviewers.extend(owners)
                break
        
        return list(set(reviewers))[:3]  # Max 3 reviewers
    
    def generate_changelog_entry(
        self,
        pr_number: int,
        title: str,
        template_type: str,
        author: str
    ) -> str:
        """Generate a changelog entry for the PR"""
        type_prefixes = {
            "feature": "✨ **Added**",
            "bugfix": "🐛 **Fixed**",
            "hotfix": "🔥 **Hotfix**",
            "docs": "📝 **Documentation**",
            "refactor": "♻️ **Changed**"
        }
        
        prefix = type_prefixes.get(template_type, "🔧 **Changed**")
        
        # Clean up title (remove conventional commit prefix if present)
        clean_title = re.sub(r'^(feat|fix|docs|refactor|chore|test):\s*', '', title, flags=re.IGNORECASE)
        
        return f"{prefix}: {clean_title} ([#{pr_number}](#{pr_number})) by @{author}"


def main():
    """CLI for PR template processing"""
    parser = argparse.ArgumentParser(description="Apply PR templates and extract metadata")
    parser.add_argument("--branch", help="Current branch name")
    parser.add_argument("--title", help="PR title")
    parser.add_argument("--type", choices=["feature", "bugfix", "hotfix", "docs", "refactor"],
                       help="Template type (auto-detected if not specified)")
    parser.add_argument("--commits", help="File containing commit messages")
    parser.add_argument("--output", default="pr_body.md", help="Output file for PR body")
    parser.add_argument("--metadata", action="store_true", help="Output metadata as JSON")
    
    args = parser.parse_args()
    
    # Get current git info if not provided
    if not args.branch:
        import subprocess
        result = subprocess.run(["git", "branch", "--show-current"], 
                               capture_output=True, text=True)
        args.branch = result.stdout.strip()
    
    # Get commit messages
    commit_messages = []
    if args.commits and os.path.exists(args.commits):
        with open(args.commits, 'r') as f:
            commit_messages = [line.strip() for line in f if line.strip()]
    else:
        # Get from git log
        import subprocess
        result = subprocess.run(
            ["git", "log", "--format=%s", "origin/main..HEAD"],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            commit_messages = result.stdout.strip().split('\n')
    
    # Process template
    processor = PRTemplateProcessor()
    
    template_type = args.type
    if not template_type:
        template_type = processor.detect_pr_type(args.branch, commit_messages)
    
    body, metadata = processor.generate_pr_body(
        template_type=template_type,
        title=args.title or "PR Title",
        branch_name=args.branch,
        commit_messages=commit_messages
    )
    
    # Write output
    with open(args.output, 'w') as f:
        f.write(body)
    
    print(f"✓ Generated PR body: {args.output}")
    print(f"  Template: {template_type}")
    print(f"  Issues: {', '.join(['#' + i for i in metadata['issues']]) if metadata['issues'] else 'None'}")
    print(f"  Suggested labels: {', '.join(metadata['suggested_labels'])}")
    
    if metadata['suggested_reviewers']:
        print(f"  Suggested reviewers: {', '.join(metadata['suggested_reviewers'])}")
    
    # Output metadata if requested
    if args.metadata:
        metadata_file = args.output.replace('.md', '_metadata.json')
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"✓ Metadata saved: {metadata_file}")


if __name__ == "__main__":
    main()
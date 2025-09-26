"""
GlassBox Evidence Manager Module

This module provides classes for managing evidence in compliance scenarios
according to the GlassBox Standard v1.0.
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Union
from .exceptions import EvidenceException


class EvidenceManager:
    """
    Manager for handling evidence in compliance scenarios.
    
    This manager provides methods for creating, storing, retrieving, and validating
    evidence according to the GlassBox Standard v1.0.
    """
    
    VALID_EVIDENCE_TYPES = [
        'log', 'document', 'metric', 'user_input', 'system_event'
    ]
    
    def __init__(self, storage_backend: Optional[Dict[str, Any]] = None):
        """
        Initialize the evidence manager.
        
        Args:
            storage_backend: Configuration for storage backend
        """
        self.storage_backend = storage_backend or {'type': 'memory'}
        self.evidence_store = {}  # In-memory storage by default
        self.indexes = {
            'by_type': {},
            'by_source': {},
            'by_timestamp': {}
        }
    
    def create_evidence(self, evidence_type: str, content: Dict[str, Any], 
                       source: str = 'system', evidence_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Create new evidence.
        
        Args:
            evidence_type: Type of evidence
            content: Evidence content
            source: Source of the evidence
            evidence_id: Optional custom evidence ID
            
        Returns:
            Created evidence dictionary
            
        Raises:
            EvidenceException: If evidence creation fails
        """
        if evidence_type not in self.VALID_EVIDENCE_TYPES:
            raise EvidenceException(f"Invalid evidence type: {evidence_type}")
        
        if not content:
            raise EvidenceException("Evidence content cannot be empty")
        
        # Generate evidence ID if not provided
        if not evidence_id:
            evidence_id = f"evd_{hashlib.md5(f'{evidence_type}_{source}_{datetime.now().isoformat()}'.encode()).hexdigest()[:16]}"
        
        # Create evidence object
        timestamp = datetime.now(timezone.utc)
        evidence = {
            'id': evidence_id,
            'type': evidence_type,
            'content': content,
            'timestamp': timestamp.isoformat(),
            'source': source,
            'hash': self._calculate_hash(content)
        }
        
        # Store evidence
        self._store_evidence(evidence)
        
        return evidence
    
    def get_evidence(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve evidence by ID.
        
        Args:
            evidence_id: ID of the evidence to retrieve
            
        Returns:
            Evidence dictionary or None if not found
        """
        return self.evidence_store.get(evidence_id)
    
    def get_evidence_by_type(self, evidence_type: str) -> List[Dict[str, Any]]:
        """
        Retrieve all evidence of a specific type.
        
        Args:
            evidence_type: Type of evidence to retrieve
            
        Returns:
            List of evidence dictionaries
        """
        return self.indexes['by_type'].get(evidence_type, []).copy()
    
    def get_evidence_by_source(self, source: str) -> List[Dict[str, Any]]:
        """
        Retrieve all evidence from a specific source.
        
        Args:
            source: Source of evidence to retrieve
            
        Returns:
            List of evidence dictionaries
        """
        return self.indexes['by_source'].get(source, []).copy()
    
    def get_evidence_by_timerange(self, start_time: datetime, end_time: datetime) -> List[Dict[str, Any]]:
        """
        Retrieve evidence within a time range.
        
        Args:
            start_time: Start of time range
            end_time: End of time range
            
        Returns:
            List of evidence dictionaries
        """
        all_evidence = []
        
        for evidence_list in self.indexes['by_timestamp'].values():
            for evidence in evidence_list:
                evidence_time = datetime.fromisoformat(evidence['timestamp'].replace('Z', '+00:00'))
                if start_time <= evidence_time <= end_time:
                    all_evidence.append(evidence)
        
        # Sort by timestamp
        all_evidence.sort(key=lambda x: x['timestamp'])
        
        return all_evidence
    
    def search_evidence(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Search for evidence based on query criteria.
        
        Args:
            query: Search criteria
            
        Returns:
            List of matching evidence dictionaries
        """
        results = []
        
        for evidence in self.evidence_store.values():
            if self._matches_query(evidence, query):
                results.append(evidence)
        
        return results
    
    def verify_evidence_integrity(self, evidence_id: str) -> Dict[str, Any]:
        """
        Verify the integrity of evidence.
        
        Args:
            evidence_id: ID of the evidence to verify
            
        Returns:
            Verification result
        """
        evidence = self.get_evidence(evidence_id)
        if not evidence:
            return {
                'valid': False,
                'reason': 'Evidence not found'
            }
        
        # Recalculate hash
        current_hash = self._calculate_hash(evidence['content'])
        stored_hash = evidence.get('hash')
        
        if not stored_hash:
            return {
                'valid': False,
                'reason': 'No hash stored for evidence'
            }
        
        is_valid = current_hash == stored_hash
        
        return {
            'valid': is_valid,
            'stored_hash': stored_hash,
            'calculated_hash': current_hash,
            'reason': 'Hashes match' if is_valid else 'Hashes do not match'
        }
    
    def create_evidence_chain(self, evidence_ids: List[str]) -> Dict[str, Any]:
        """
        Create an evidence chain from multiple evidence items.
        
        Args:
            evidence_ids: List of evidence IDs to chain
            
        Returns:
            Evidence chain information
        """
        chain = []
        chain_hash = hashlib.sha256()
        
        for evidence_id in evidence_ids:
            evidence = self.get_evidence(evidence_id)
            if not evidence:
                raise EvidenceException(f"Evidence not found: {evidence_id}")
            
            # Verify integrity
            verification = self.verify_evidence_integrity(evidence_id)
            if not verification['valid']:
                raise EvidenceException(f"Evidence integrity check failed: {evidence_id}")
            
            chain.append({
                'evidence_id': evidence_id,
                'evidence': evidence,
                'verification': verification
            })
            
            # Update chain hash
            chain_hash.update(evidence['hash'].encode())
        
        return {
            'chain_id': f"chain_{chain_hash.hexdigest()[:16]}",
            'evidence_count': len(chain),
            'chain_hash': chain_hash.hexdigest(),
            'chain': chain,
            'created': datetime.now(timezone.utc).isoformat()
        }
    
    def export_evidence(self, evidence_ids: List[str], format: str = 'json') -> Union[str, bytes]:
        """
        Export evidence in the specified format.
        
        Args:
            evidence_ids: List of evidence IDs to export
            format: Export format ('json', 'csv', 'xml')
            
        Returns:
            Exported evidence data
            
        Raises:
            EvidenceException: If export fails
        """
        evidence_list = []
        
        for evidence_id in evidence_ids:
            evidence = self.get_evidence(evidence_id)
            if evidence:
                evidence_list.append(evidence)
        
        if not evidence_list:
            raise EvidenceException("No evidence found to export")
        
        if format == 'json':
            return json.dumps(evidence_list, indent=2, default=str)
        elif format == 'csv':
            return self._export_to_csv(evidence_list)
        elif format == 'xml':
            return self._export_to_xml(evidence_list)
        else:
            raise EvidenceException(f"Unsupported export format: {format}")
    
    def delete_evidence(self, evidence_id: str) -> bool:
        """
        Delete evidence by ID.
        
        Args:
            evidence_id: ID of the evidence to delete
            
        Returns:
            True if deletion was successful, False otherwise
        """
        evidence = self.get_evidence(evidence_id)
        if not evidence:
            return False
        
        # Remove from storage
        if evidence_id in self.evidence_store:
            del self.evidence_store[evidence_id]
        
        # Remove from indexes
        self._remove_from_indexes(evidence)
        
        return True
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get evidence statistics.
        
        Returns:
            Statistics dictionary
        """
        stats = {
            'total_evidence': len(self.evidence_store),
            'by_type': {},
            'by_source': {},
            'oldest_evidence': None,
            'newest_evidence': None
        }
        
        # Count by type
        for evidence_type, evidence_list in self.indexes['by_type'].items():
            stats['by_type'][evidence_type] = len(evidence_list)
        
        # Count by source
        for source, evidence_list in self.indexes['by_source'].items():
            stats['by_source'][source] = len(evidence_list)
        
        # Find oldest and newest
        if self.evidence_store:
            all_evidence = list(self.evidence_store.values())
            all_evidence.sort(key=lambda x: x['timestamp'])
            stats['oldest_evidence'] = all_evidence[0]['timestamp']
            stats['newest_evidence'] = all_evidence[-1]['timestamp']
        
        return stats
    
    def _store_evidence(self, evidence: Dict[str, Any]):
        """Store evidence and update indexes."""
        evidence_id = evidence['id']
        
        # Store in main storage
        self.evidence_store[evidence_id] = evidence.copy()
        
        # Update indexes
        self._update_indexes(evidence)
    
    def _update_indexes(self, evidence: Dict[str, Any]):
        """Update indexes with new evidence."""
        evidence_id = evidence['id']
        evidence_type = evidence['type']
        source = evidence['source']
        timestamp = evidence['timestamp']
        
        # Type index
        if evidence_type not in self.indexes['by_type']:
            self.indexes['by_type'][evidence_type] = []
        self.indexes['by_type'][evidence_type].append(evidence_id)
        
        # Source index
        if source not in self.indexes['by_source']:
            self.indexes['by_source'][source] = []
        self.indexes['by_source'][source].append(evidence_id)
        
        # Timestamp index (by date)
        date_key = timestamp[:10]  # YYYY-MM-DD
        if date_key not in self.indexes['by_timestamp']:
            self.indexes['by_timestamp'][date_key] = []
        self.indexes['by_timestamp'][date_key].append(evidence_id)
    
    def _remove_from_indexes(self, evidence: Dict[str, Any]):
        """Remove evidence from indexes."""
        evidence_id = evidence['id']
        evidence_type = evidence['type']
        source = evidence['source']
        timestamp = evidence['timestamp']
        
        # Remove from type index
        if evidence_type in self.indexes['by_type']:
            if evidence_id in self.indexes['by_type'][evidence_type]:
                self.indexes['by_type'][evidence_type].remove(evidence_id)
        
        # Remove from source index
        if source in self.indexes['by_source']:
            if evidence_id in self.indexes['by_source'][source]:
                self.indexes['by_source'][source].remove(evidence_id)
        
        # Remove from timestamp index
        date_key = timestamp[:10]
        if date_key in self.indexes['by_timestamp']:
            if evidence_id in self.indexes['by_timestamp'][date_key]:
                self.indexes['by_timestamp'][date_key].remove(evidence_id)
    
    def _matches_query(self, evidence: Dict[str, Any], query: Dict[str, Any]) -> bool:
        """Check if evidence matches search query."""
        for key, value in query.items():
            if key == 'type':
                if evidence.get('type') != value:
                    return False
            elif key == 'source':
                if evidence.get('source') != value:
                    return False
            elif key == 'content_contains':
                if value not in json.dumps(evidence.get('content', {})):
                    return False
            elif key.startswith('content.'):
                # Search in content fields
                content_key = key[8:]  # Remove 'content.' prefix
                content = evidence.get('content', {})
                if content_key not in content or content[content_key] != value:
                    return False
            elif key == 'after':
                evidence_time = datetime.fromisoformat(evidence['timestamp'].replace('Z', '+00:00'))
                if evidence_time < value:
                    return False
            elif key == 'before':
                evidence_time = datetime.fromisoformat(evidence['timestamp'].replace('Z', '+00:00'))
                if evidence_time > value:
                    return False
        
        return True
    
    def _calculate_hash(self, content: Dict[str, Any]) -> str:
        """Calculate SHA-256 hash of content."""
        content_str = json.dumps(content, sort_keys=True, default=str)
        return hashlib.sha256(content_str.encode()).hexdigest()
    
    def _export_to_csv(self, evidence_list: List[Dict[str, Any]]) -> str:
        """Export evidence to CSV format."""
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['ID', 'Type', 'Source', 'Timestamp', 'Content', 'Hash'])
        
        # Write evidence rows
        for evidence in evidence_list:
            writer.writerow([
                evidence['id'],
                evidence['type'],
                evidence['source'],
                evidence['timestamp'],
                json.dumps(evidence['content']),
                evidence['hash']
            ])
        
        return output.getvalue()
    
    def _export_to_xml(self, evidence_list: List[Dict[str, Any]]) -> str:
        """Export evidence to XML format."""
        xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>']
        xml_lines.append('<evidence>')
        
        for evidence in evidence_list:
            xml_lines.append('  <item>')
            xml_lines.append(f'    <id>{evidence["id"]}</id>')
            xml_lines.append(f'    <type>{evidence["type"]}</type>')
            xml_lines.append(f'    <source>{evidence["source"]}</source>')
            xml_lines.append(f'    <timestamp>{evidence["timestamp"]}</timestamp>')
            xml_lines.append(f'    <hash>{evidence["hash"]}</hash>')
            xml_lines.append('    <content>')
            
            # Add content fields
            for key, value in evidence['content'].items():
                xml_lines.append(f'      <{key}>{value}</{key}>')
            
            xml_lines.append('    </content>')
            xml_lines.append('  </item>')
        
        xml_lines.append('</evidence>')
        
        return '\n'.join(xml_lines)
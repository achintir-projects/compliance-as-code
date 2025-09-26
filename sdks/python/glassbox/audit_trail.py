"""
GlassBox Audit Trail Module

This module provides classes for managing audit trails in compliance scenarios
according to the GlassBox Standard v1.0.
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Union
from .exceptions import AuditException


class AuditTrail:
    """
    Manager for handling audit trails in compliance scenarios.
    
    This manager provides methods for creating, storing, retrieving, and managing
    audit trails according to the GlassBox Standard v1.0.
    """
    
    def __init__(self, storage_backend: Optional[Dict[str, Any]] = None):
        """
        Initialize the audit trail manager.
        
        Args:
            storage_backend: Configuration for storage backend
        """
        self.storage_backend = storage_backend or {'type': 'memory'}
        self.audit_store = {}  # In-memory storage by default
        self.bundles = {}  # Store audit bundles
        self.indexes = {
            'by_user': {},
            'by_action': {},
            'by_timestamp': {},
            'by_bundle': {}
        }
    
    def create_audit_entry(self, action: str, user: str, details: Dict[str, Any],
                          audit_id: Optional[str] = None, bundle_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new audit entry.
        
        Args:
            action: Action being audited
            user: User performing the action
            details: Details of the action
            audit_id: Optional custom audit ID
            bundle_id: Optional bundle ID to associate with
            
        Returns:
            Created audit entry dictionary
            
        Raises:
            AuditException: If audit entry creation fails
        """
        if not action:
            raise AuditException("Action cannot be empty")
        
        if not user:
            raise AuditException("User cannot be empty")
        
        # Generate audit ID if not provided
        if not audit_id:
            audit_id = f"aud_{hashlib.md5(f'{action}_{user}_{datetime.now().isoformat()}'.encode()).hexdigest()[:16]}"
        
        # Create audit entry
        timestamp = datetime.now(timezone.utc)
        audit_entry = {
            'id': audit_id,
            'timestamp': timestamp.isoformat(),
            'action': action,
            'user': user,
            'details': details,
            'bundle_id': bundle_id,
            'hash': self._calculate_hash(action, user, details, timestamp)
        }
        
        # Store audit entry
        self._store_audit_entry(audit_entry)
        
        return audit_entry
    
    def get_audit_entry(self, audit_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve an audit entry by ID.
        
        Args:
            audit_id: ID of the audit entry to retrieve
            
        Returns:
            Audit entry dictionary or None if not found
        """
        return self.audit_store.get(audit_id)
    
    def get_audit_entries_by_user(self, user: str) -> List[Dict[str, Any]]:
        """
        Retrieve all audit entries for a specific user.
        
        Args:
            user: User to retrieve entries for
            
        Returns:
            List of audit entry dictionaries
        """
        return self.indexes['by_user'].get(user, []).copy()
    
    def get_audit_entries_by_action(self, action: str) -> List[Dict[str, Any]]:
        """
        Retrieve all audit entries for a specific action.
        
        Args:
            action: Action to retrieve entries for
            
        Returns:
            List of audit entry dictionaries
        """
        return self.indexes['by_action'].get(action, []).copy()
    
    def get_audit_entries_by_bundle(self, bundle_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve all audit entries for a specific bundle.
        
        Args:
            bundle_id: Bundle ID to retrieve entries for
            
        Returns:
            List of audit entry dictionaries
        """
        return self.indexes['by_bundle'].get(bundle_id, []).copy()
    
    def get_audit_entries_by_timerange(self, start_time: datetime, end_time: datetime) -> List[Dict[str, Any]]:
        """
        Retrieve audit entries within a time range.
        
        Args:
            start_time: Start of time range
            end_time: End of time range
            
        Returns:
            List of audit entry dictionaries
        """
        all_entries = []
        
        for entry_list in self.indexes['by_timestamp'].values():
            for entry in entry_list:
                entry_time = datetime.fromisoformat(entry['timestamp'].replace('Z', '+00:00'))
                if start_time <= entry_time <= end_time:
                    all_entries.append(entry)
        
        # Sort by timestamp
        all_entries.sort(key=lambda x: x['timestamp'])
        
        return all_entries
    
    def search_audit_entries(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Search for audit entries based on query criteria.
        
        Args:
            query: Search criteria
            
        Returns:
            List of matching audit entry dictionaries
        """
        results = []
        
        for entry in self.audit_store.values():
            if self._matches_query(entry, query):
                results.append(entry)
        
        return results
    
    def create_audit_bundle(self, name: str, description: str, 
                           audit_ids: List[str], bundle_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Create an audit bundle from multiple audit entries.
        
        Args:
            name: Name of the audit bundle
            description: Description of the audit bundle
            audit_ids: List of audit entry IDs to include
            bundle_id: Optional custom bundle ID
            
        Returns:
            Created audit bundle dictionary
            
        Raises:
            AuditException: If bundle creation fails
        """
        if not name:
            raise AuditException("Bundle name cannot be empty")
        
        if not audit_ids:
            raise AuditException("Audit IDs list cannot be empty")
        
        # Generate bundle ID if not provided
        if not bundle_id:
            bundle_id = f"bundle_{hashlib.md5(f'{name}_{datetime.now().isoformat()}'.encode()).hexdigest()[:16]}"
        
        # Collect audit entries
        entries = []
        bundle_hash = hashlib.sha256()
        
        for audit_id in audit_ids:
            entry = self.get_audit_entry(audit_id)
            if not entry:
                raise AuditException(f"Audit entry not found: {audit_id}")
            
            # Verify integrity
            verification = self.verify_audit_entry_integrity(audit_id)
            if not verification['valid']:
                raise AuditException(f"Audit entry integrity check failed: {audit_id}")
            
            entries.append(entry)
            bundle_hash.update(entry['hash'].encode())
        
        # Create bundle
        timestamp = datetime.now(timezone.utc)
        bundle = {
            'id': bundle_id,
            'name': name,
            'description': description,
            'created': timestamp.isoformat(),
            'modified': timestamp.isoformat(),
            'version': '1.0',
            'entry_count': len(entries),
            'bundle_hash': bundle_hash.hexdigest(),
            'entries': entries,
            'checksum': self._calculate_bundle_checksum(entries)
        }
        
        # Store bundle
        self.bundles[bundle_id] = bundle
        
        # Update indexes
        for audit_id in audit_ids:
            entry = self.get_audit_entry(audit_id)
            if entry:
                entry['bundle_id'] = bundle_id
        
        return bundle
    
    def get_audit_bundle(self, bundle_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve an audit bundle by ID.
        
        Args:
            bundle_id: ID of the audit bundle to retrieve
            
        Returns:
            Audit bundle dictionary or None if not found
        """
        return self.bundles.get(bundle_id)
    
    def verify_audit_entry_integrity(self, audit_id: str) -> Dict[str, Any]:
        """
        Verify the integrity of an audit entry.
        
        Args:
            audit_id: ID of the audit entry to verify
            
        Returns:
            Verification result
        """
        entry = self.get_audit_entry(audit_id)
        if not entry:
            return {
                'valid': False,
                'reason': 'Audit entry not found'
            }
        
        # Recalculate hash
        timestamp = datetime.fromisoformat(entry['timestamp'].replace('Z', '+00:00'))
        current_hash = self._calculate_hash(entry['action'], entry['user'], entry['details'], timestamp)
        stored_hash = entry.get('hash')
        
        if not stored_hash:
            return {
                'valid': False,
                'reason': 'No hash stored for audit entry'
            }
        
        is_valid = current_hash == stored_hash
        
        return {
            'valid': is_valid,
            'stored_hash': stored_hash,
            'calculated_hash': current_hash,
            'reason': 'Hashes match' if is_valid else 'Hashes do not match'
        }
    
    def verify_audit_bundle_integrity(self, bundle_id: str) -> Dict[str, Any]:
        """
        Verify the integrity of an audit bundle.
        
        Args:
            bundle_id: ID of the audit bundle to verify
            
        Returns:
            Verification result
        """
        bundle = self.get_audit_bundle(bundle_id)
        if not bundle:
            return {
                'valid': False,
                'reason': 'Audit bundle not found'
            }
        
        # Verify all entries
        all_entries_valid = True
        entry_verifications = []
        
        for entry in bundle['entries']:
            verification = self.verify_audit_entry_integrity(entry['id'])
            entry_verifications.append(verification)
            if not verification['valid']:
                all_entries_valid = False
        
        # Verify bundle checksum
        current_checksum = self._calculate_bundle_checksum(bundle['entries'])
        stored_checksum = bundle.get('checksum')
        
        checksum_valid = current_checksum == stored_checksum
        
        overall_valid = all_entries_valid and checksum_valid
        
        return {
            'valid': overall_valid,
            'all_entries_valid': all_entries_valid,
            'checksum_valid': checksum_valid,
            'stored_checksum': stored_checksum,
            'calculated_checksum': current_checksum,
            'entry_verifications': entry_verifications,
            'reason': 'Bundle integrity verified' if overall_valid else 'Bundle integrity check failed'
        }
    
    def export_audit_trail(self, format: str = 'json', 
                          audit_ids: Optional[List[str]] = None,
                          bundle_id: Optional[str] = None) -> Union[str, bytes]:
        """
        Export audit trail in the specified format.
        
        Args:
            format: Export format ('json', 'csv', 'xml')
            audit_ids: Optional list of audit entry IDs to export
            bundle_id: Optional bundle ID to export
            
        Returns:
            Exported audit trail data
            
        Raises:
            AuditException: If export fails
        """
        if bundle_id:
            bundle = self.get_audit_bundle(bundle_id)
            if not bundle:
                raise AuditException(f"Audit bundle not found: {bundle_id}")
            entries = bundle['entries']
        elif audit_ids:
            entries = []
            for audit_id in audit_ids:
                entry = self.get_audit_entry(audit_id)
                if entry:
                    entries.append(entry)
        else:
            entries = list(self.audit_store.values())
        
        if not entries:
            raise AuditException("No audit entries found to export")
        
        if format == 'json':
            return json.dumps(entries, indent=2, default=str)
        elif format == 'csv':
            return self._export_to_csv(entries)
        elif format == 'xml':
            return self._export_to_xml(entries)
        else:
            raise AuditException(f"Unsupported export format: {format}")
    
    def generate_audit_report(self, start_time: datetime, end_time: datetime,
                            include_statistics: bool = True) -> Dict[str, Any]:
        """
        Generate an audit report for a time period.
        
        Args:
            start_time: Start of report period
            end_time: End of report period
            include_statistics: Whether to include statistics
            
        Returns:
            Audit report dictionary
        """
        entries = self.get_audit_entries_by_timerange(start_time, end_time)
        
        report = {
            'report_id': f"report_{hashlib.md5(f'{start_time}_{end_time}'.encode()).hexdigest()[:16]}",
            'period': {
                'start': start_time.isoformat(),
                'end': end_time.isoformat()
            },
            'generated': datetime.now(timezone.utc).isoformat(),
            'total_entries': len(entries),
            'entries': entries
        }
        
        if include_statistics:
            report['statistics'] = self._generate_statistics(entries)
        
        return report
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get audit trail statistics.
        
        Returns:
            Statistics dictionary
        """
        stats = {
            'total_entries': len(self.audit_store),
            'total_bundles': len(self.bundles),
            'by_user': {},
            'by_action': {},
            'by_bundle': {},
            'oldest_entry': None,
            'newest_entry': None
        }
        
        # Count by user
        for user, entry_list in self.indexes['by_user'].items():
            stats['by_user'][user] = len(entry_list)
        
        # Count by action
        for action, entry_list in self.indexes['by_action'].items():
            stats['by_action'][action] = len(entry_list)
        
        # Count by bundle
        for bundle_id, entry_list in self.indexes['by_bundle'].items():
            stats['by_bundle'][bundle_id] = len(entry_list)
        
        # Find oldest and newest entries
        if self.audit_store:
            all_entries = list(self.audit_store.values())
            all_entries.sort(key=lambda x: x['timestamp'])
            stats['oldest_entry'] = all_entries[0]['timestamp']
            stats['newest_entry'] = all_entries[-1]['timestamp']
        
        return stats
    
    def _store_audit_entry(self, audit_entry: Dict[str, Any]):
        """Store audit entry and update indexes."""
        audit_id = audit_entry['id']
        
        # Store in main storage
        self.audit_store[audit_id] = audit_entry.copy()
        
        # Update indexes
        self._update_indexes(audit_entry)
    
    def _update_indexes(self, audit_entry: Dict[str, Any]):
        """Update indexes with new audit entry."""
        audit_id = audit_entry['id']
        user = audit_entry['user']
        action = audit_entry['action']
        timestamp = audit_entry['timestamp']
        bundle_id = audit_entry.get('bundle_id')
        
        # User index
        if user not in self.indexes['by_user']:
            self.indexes['by_user'][user] = []
        self.indexes['by_user'][user].append(audit_id)
        
        # Action index
        if action not in self.indexes['by_action']:
            self.indexes['by_action'][action] = []
        self.indexes['by_action'][action].append(audit_id)
        
        # Timestamp index (by date)
        date_key = timestamp[:10]  # YYYY-MM-DD
        if date_key not in self.indexes['by_timestamp']:
            self.indexes['by_timestamp'][date_key] = []
        self.indexes['by_timestamp'][date_key].append(audit_id)
        
        # Bundle index
        if bundle_id:
            if bundle_id not in self.indexes['by_bundle']:
                self.indexes['by_bundle'][bundle_id] = []
            self.indexes['by_bundle'][bundle_id].append(audit_id)
    
    def _matches_query(self, audit_entry: Dict[str, Any], query: Dict[str, Any]) -> bool:
        """Check if audit entry matches search query."""
        for key, value in query.items():
            if key == 'user':
                if audit_entry.get('user') != value:
                    return False
            elif key == 'action':
                if audit_entry.get('action') != value:
                    return False
            elif key == 'bundle_id':
                if audit_entry.get('bundle_id') != value:
                    return False
            elif key.startswith('details.'):
                # Search in details fields
                details_key = key[8:]  # Remove 'details.' prefix
                details = audit_entry.get('details', {})
                if details_key not in details or details[details_key] != value:
                    return False
            elif key == 'after':
                entry_time = datetime.fromisoformat(audit_entry['timestamp'].replace('Z', '+00:00'))
                if entry_time < value:
                    return False
            elif key == 'before':
                entry_time = datetime.fromisoformat(audit_entry['timestamp'].replace('Z', '+00:00'))
                if entry_time > value:
                    return False
        
        return True
    
    def _calculate_hash(self, action: str, user: str, details: Dict[str, Any], timestamp: datetime) -> str:
        """Calculate SHA-256 hash of audit entry data."""
        data_str = f"{action}:{user}:{json.dumps(details, sort_keys=True)}:{timestamp.isoformat()}"
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    def _calculate_bundle_checksum(self, entries: List[Dict[str, Any]]) -> str:
        """Calculate checksum for audit bundle."""
        bundle_hash = hashlib.sha256()
        
        for entry in sorted(entries, key=lambda x: x['timestamp']):
            bundle_hash.update(entry['hash'].encode())
        
        return bundle_hash.hexdigest()
    
    def _export_to_csv(self, entries: List[Dict[str, Any]]) -> str:
        """Export audit entries to CSV format."""
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['ID', 'Timestamp', 'Action', 'User', 'Bundle ID', 'Details', 'Hash'])
        
        # Write entry rows
        for entry in entries:
            writer.writerow([
                entry['id'],
                entry['timestamp'],
                entry['action'],
                entry['user'],
                entry.get('bundle_id', ''),
                json.dumps(entry['details']),
                entry['hash']
            ])
        
        return output.getvalue()
    
    def _export_to_xml(self, entries: List[Dict[str, Any]]) -> str:
        """Export audit entries to XML format."""
        xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>']
        xml_lines.append('<audit_trail>')
        
        for entry in entries:
            xml_lines.append('  <entry>')
            xml_lines.append(f'    <id>{entry["id"]}</id>')
            xml_lines.append(f'    <timestamp>{entry["timestamp"]}</timestamp>')
            xml_lines.append(f'    <action>{entry["action"]}</action>')
            xml_lines.append(f'    <user>{entry["user"]}</user>')
            if entry.get('bundle_id'):
                xml_lines.append(f'    <bundle_id>{entry["bundle_id"]}</bundle_id>')
            xml_lines.append(f'    <hash>{entry["hash"]}</hash>')
            xml_lines.append('    <details>')
            
            # Add details fields
            for key, value in entry['details'].items():
                xml_lines.append(f'      <{key}>{value}</{key}>')
            
            xml_lines.append('    </details>')
            xml_lines.append('  </entry>')
        
        xml_lines.append('</audit_trail>')
        
        return '\n'.join(xml_lines)
    
    def _generate_statistics(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate statistics for a set of audit entries."""
        stats = {
            'total_entries': len(entries),
            'unique_users': len(set(entry['user'] for entry in entries)),
            'unique_actions': len(set(entry['action'] for entry in entries)),
            'by_user': {},
            'by_action': {},
            'by_hour': {},
            'by_day': {}
        }
        
        # Count by user
        for entry in entries:
            user = entry['user']
            stats['by_user'][user] = stats['by_user'].get(user, 0) + 1
        
        # Count by action
        for entry in entries:
            action = entry['action']
            stats['by_action'][action] = stats['by_action'].get(action, 0) + 1
        
        # Count by hour
        for entry in entries:
            hour = entry['timestamp'][:13]  # YYYY-MM-DDTHH
            stats['by_hour'][hour] = stats['by_hour'].get(hour, 0) + 1
        
        # Count by day
        for entry in entries:
            day = entry['timestamp'][:10]  # YYYY-MM-DD
            stats['by_day'][day] = stats['by_day'].get(day, 0) + 1
        
        return stats
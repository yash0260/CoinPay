'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TransactionFilters, FilterOptions } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import '@/styles/filters.css';

interface FilterBarProps {
  filters: TransactionFilters;
  filterOptions: FilterOptions | null;
  onFiltersChange: (filters: Partial<TransactionFilters>) => void;
  onReset: () => void;
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(s => s !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  return (
    <div className="multi-select" ref={ref}>
      <button
        className="multi-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>
          {selected.length === 0 ? `All ${label}` : `${label}`}
        </span>
        {selected.length > 0 && <span className="count-badge">{selected.length}</span>}
        <span style={{ fontSize: '10px', opacity: 0.5 }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="multi-select-dropdown" role="listbox" aria-multiselectable="true">
          {options.map(option => (
            <div
              key={option}
              className="multi-select-option"
              onClick={() => toggleOption(option)}
              role="option"
              aria-selected={selected.includes(option)}
            >
              <span className={`multi-select-checkbox ${selected.includes(option) ? 'checked' : ''}`} />
              <span>{option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterBar({ filters, filterOptions, onFiltersChange, onReset }: FilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const searchTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  const selectedCategories = filters.category ? filters.category.split(',') : [];
  const selectedStatuses = filters.status ? filters.status.split(',') : [];

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      onFiltersChange({ search: value || undefined });
    }, 300);
  }, [onFiltersChange]);

  const handleCategoryChange = useCallback((values: string[]) => {
    onFiltersChange({ category: values.length > 0 ? values.join(',') : undefined });
  }, [onFiltersChange]);

  const handleStatusChange = useCallback((values: string[]) => {
    onFiltersChange({ status: values.length > 0 ? values.join(',') : undefined });
  }, [onFiltersChange]);

  const hasActiveFilters = filters.category || filters.status || filters.date_from ||
    filters.date_to || filters.amount_min !== undefined || filters.amount_max !== undefined || filters.search;

  const removeFilter = (key: keyof TransactionFilters) => {
    if (key === 'search') setSearchValue('');
    onFiltersChange({ [key]: undefined });
  };

  const handleReset = () => {
    setSearchValue('');
    onReset();
  };

  return (
    <div>
      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="active-filters">
          {filters.search && (
            <span className="filter-chip">
              Search: {filters.search}
              <button className="chip-remove" onClick={() => removeFilter('search')} aria-label="Remove search filter">✕</button>
            </span>
          )}
          {selectedCategories.map(cat => (
            <span key={cat} className="filter-chip">
              {cat}
              <button
                className="chip-remove"
                onClick={() => handleCategoryChange(selectedCategories.filter(c => c !== cat))}
                aria-label={`Remove ${cat} filter`}
              >✕</button>
            </span>
          ))}
          {selectedStatuses.map(status => (
            <span key={status} className="filter-chip">
              {status}
              <button
                className="chip-remove"
                onClick={() => handleStatusChange(selectedStatuses.filter(s => s !== status))}
                aria-label={`Remove ${status} filter`}
              >✕</button>
            </span>
          ))}
          {filters.date_from && (
            <span className="filter-chip">
              From: {filters.date_from}
              <button className="chip-remove" onClick={() => removeFilter('date_from')}>✕</button>
            </span>
          )}
          {filters.date_to && (
            <span className="filter-chip">
              To: {filters.date_to}
              <button className="chip-remove" onClick={() => removeFilter('date_to')}>✕</button>
            </span>
          )}
          {filters.amount_min !== undefined && (
            <span className="filter-chip">
              Min: ₹{filters.amount_min}
              <button className="chip-remove" onClick={() => removeFilter('amount_min')}>✕</button>
            </span>
          )}
          {filters.amount_max !== undefined && (
            <span className="filter-chip">
              Max: ₹{filters.amount_max}
              <button className="chip-remove" onClick={() => removeFilter('amount_max')}>✕</button>
            </span>
          )}
          <button className="clear-all-btn" onClick={handleReset}>Clear all</button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="filter-bar">
        {/* Search */}
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="filter-input search-input"
            placeholder="Search merchants..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search merchant names"
          />
          {searchValue && (
            <button className="search-clear" onClick={() => handleSearchChange('')} aria-label="Clear search">✕</button>
          )}
        </div>

        {/* Category Filter */}
        <div className="filter-group">
          <MultiSelect
            label="Categories"
            options={filterOptions?.categories || []}
            selected={selectedCategories}
            onChange={handleCategoryChange}
          />
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <MultiSelect
            label="Status"
            options={filterOptions?.statuses || ['SUCCESS', 'FAILED', 'PENDING']}
            selected={selectedStatuses}
            onChange={handleStatusChange}
          />
        </div>

        {/* Date Range */}
        <div className="filter-group">
          <input
            type="date"
            className="filter-input"
            value={filters.date_from || ''}
            onChange={(e) => onFiltersChange({ date_from: e.target.value || undefined })}
            aria-label="From date"
            placeholder="From"
          />
        </div>
        <div className="filter-group">
          <input
            type="date"
            className="filter-input"
            value={filters.date_to || ''}
            onChange={(e) => onFiltersChange({ date_to: e.target.value || undefined })}
            aria-label="To date"
            placeholder="To"
          />
        </div>

        {/* Amount Range */}
        <div className="filter-group">
          <input
            type="number"
            className="filter-input"
            placeholder="Min ₹"
            value={filters.amount_min ?? ''}
            onChange={(e) => onFiltersChange({
              amount_min: e.target.value ? Number(e.target.value) : undefined
            })}
            aria-label="Minimum amount"
            style={{ width: '100px' }}
          />
        </div>
        <div className="filter-group">
          <input
            type="number"
            className="filter-input"
            placeholder="Max ₹"
            value={filters.amount_max ?? ''}
            onChange={(e) => onFiltersChange({
              amount_max: e.target.value ? Number(e.target.value) : undefined
            })}
            aria-label="Maximum amount"
            style={{ width: '100px' }}
          />
        </div>
      </div>
    </div>
  );
}

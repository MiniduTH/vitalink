import React from "react";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    onSearch?: (query?: string) => void;
}

export function SearchBar({ placeholder = "Search...", value, onChange, onSearch }: SearchBarProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch) onSearch(value);
    };

    return (
        <form className={styles.searchForm} onSubmit={handleSubmit}>
            <div className={styles.searchContainer}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                {value && (
                    <button type="button" className={styles.clearButton} onClick={() => onChange("")} aria-label="Clear search">
                        ✕
                    </button>
                )}
            </div>
        </form>
    );
}

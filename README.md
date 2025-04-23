# Todo Application

A Spring Boot application for managing todo items with user authentication.

## Project Structure

- `src/main/java/com/todoapp/` - Main application code
- `src/test/java/com/todoapp/` - Test code
- `src/main/resources/` - Application properties and resources

## Building and Running

```bash
# Build the application
./mvnw clean package

# Run the application
./mvnw spring-boot:run
```

## Testing

```bash
# Run tests
./mvnw test
```

## Handling Large Files

This repository is configured to prevent large files from being committed. The following files and directories are ignored:

- `target/` - Build output directory
- `*.exec` - JaCoCo execution data files
- `target/site/jacoco/` - JaCoCo reports
- `target/surefire-reports/` - Test reports

### If you need to add a large file

1. Add the file pattern to `.gitignore`
2. Remove the file from git tracking with `git rm --cached <file>`
3. Commit the changes

### Pre-commit Hook

A pre-commit hook is installed to prevent files larger than 1MB from being committed. If you need to commit a large file:

1. Temporarily disable the hook: `git commit --no-verify -m "Your message"`
2. Or modify the hook to allow your specific file

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
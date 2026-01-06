from typing import List, Optional, Union, Dict, Any
import logging
from datetime import datetime


def process_data(
    data: Union[str, List[str]], 
    operation: str = "uppercase",
    filters: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Process input data with specified operations and optional filtering.
    
    This function provides a flexible way to process string data with
    various operations while maintaining data integrity and providing
    comprehensive error handling.
    
    Args:
        data (Union[str, List[str]]): Input data to process. Can be a single
            string or a list of strings.
        operation (str, optional): Type of operation to perform. Options:
            - "uppercase": Convert to uppercase
            - "lowercase": Convert to lowercase
            - "title": Convert to title case
            - "strip": Remove leading/trailing whitespace
            - "reverse": Reverse the string(s)
            Defaults to "uppercase".
        filters (Optional[List[str]], optional): List of strings to filter out
            from the results. Defaults to None.
    
    Returns:
        Dict[str, Any]: Dictionary containing:
            - "result": Processed data
            - "operation": Operation performed
            - "count": Number of items processed
            - "timestamp": When processing occurred
            - "filtered_count": Number of items filtered out
    
    Raises:
        ValueError: If operation is not supported or data is invalid
        TypeError: If data types are incorrect
    
    Examples:
        >>> result = process_data("hello world", "uppercase")
        >>> print(result["result"])
        "HELLO WORLD"
        
        >>> result = process_data(["hello", "world"], "title", ["world"])
        >>> print(result["result"])
        ["Hello"]
    """
    # Setup logging
    logger = logging.getLogger(__name__)
    
    # Validate inputs
    if not isinstance(data, (str, list)):
        raise TypeError("Data must be a string or list of strings")
    
    valid_operations = ["uppercase", "lowercase", "title", "strip", "reverse"]
    if operation not in valid_operations:
        raise ValueError(f"Operation must be one of: {valid_operations}")
    
    if filters is not None and not isinstance(filters, list):
        raise TypeError("Filters must be a list of strings")
    
    # Convert single string to list for uniform processing
    is_single_string = isinstance(data, str)
    data_list = [data] if is_single_string else data.copy()
    
    # Validate all items are strings
    for i, item in enumerate(data_list):
        if not isinstance(item, str):
            raise TypeError(f"All data items must be strings. Item {i} is {type(item)}")
    
    # Process data
    processed_data = []
    for item in data_list:
        try:
            processed_item = _apply_operation(item, operation)
            processed_data.append(processed_item)
        except Exception as e:
            logger.error(f"Error processing item '{item}': {e}")
            raise
    
    # Apply filters if provided
    filtered_count = 0
    if filters:
        original_count = len(processed_data)
        processed_data = [item for item in processed_data if item not in filters]
        filtered_count = original_count - len(processed_data)
    
    # Prepare result
    result_data = processed_data[0] if is_single_string else processed_data
    
    return {
        "result": result_data,
        "operation": operation,
        "count": len(processed_data),
        "timestamp": datetime.now().isoformat(),
        "filtered_count": filtered_count,
        "original_type": "string" if is_single_string else "list"
    }


def _apply_operation(text: str, operation: str) -> str:
    """
    Apply the specified operation to a text string.
    
    Args:
        text (str): Text to process
        operation (str): Operation to apply
    
    Returns:
        str: Processed text
    """
    operations_map = {
        "uppercase": lambda x: x.upper(),
        "lowercase": lambda x: x.lower(),
        "title": lambda x: x.title(),
        "strip": lambda x: x.strip(),
        "reverse": lambda x: x[::-1]
    }
    
    return operations_map[operation](text)


def batch_process_files(
    file_paths: List[str], 
    operation: str = "uppercase"
) -> Dict[str, Any]:
    """
    Process multiple files with the specified operation.
    
    Args:
        file_paths (List[str]): List of file paths to process
        operation (str): Operation to apply to file contents
    
    Returns:
        Dict[str, Any]: Results of processing all files
    """
    results = {}
    errors = []
    
    for file_path in file_paths:
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                result = process_data(content, operation)
                results[file_path] = result
        except FileNotFoundError:
            error_msg = f"File not found: {file_path}"
            errors.append(error_msg)
        except Exception as e:
            error_msg = f"Error processing {file_path}: {str(e)}"
            errors.append(error_msg)
    
    return {
        "results": results,
        "errors": errors,
        "files_processed": len(results),
        "files_failed": len(errors)
    }


def main() -> None:
    """Demonstrate the data processing functions."""
    print("Data Processing Demo")
    print("=" * 30)
    
    # Single string processing
    result1 = process_data("hello world", "uppercase")
    print(f"Single string result: {result1['result']}")
    
    # List processing
    data_list = ["hello", "world", "python", "programming"]
    result2 = process_data(data_list, "title", filters=["World"])
    print(f"List result: {result2['result']}")
    print(f"Items filtered: {result2['filtered_count']}")
    
    # Error handling demo
    try:
        process_data(123, "uppercase")  # This will raise TypeError
    except TypeError as e:
        print(f"\nError handled: {e}")


if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(level=logging.INFO)
    main()
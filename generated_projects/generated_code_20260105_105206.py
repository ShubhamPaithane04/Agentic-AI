def fibonacci(n):
    """
    Calculate the nth Fibonacci number using memoization.
    
    Args:
        n (int): The position in the Fibonacci sequence
        
    Returns:
        int: The nth Fibonacci number
    """
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    
    # Use memoization for efficiency
    memo = {}
    
    def fib_helper(num):
        if num in memo:
            return memo[num]
        memo[num] = fib_helper(num - 1) + fib_helper(num - 2)
        return memo[num]
    
    return fib_helper(n)

# Example usage
if __name__ == "__main__":
    for i in range(10):
        print(f"F({i}) = {fibonacci(i)}")
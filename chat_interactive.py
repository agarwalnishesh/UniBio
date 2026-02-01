#!/usr/bin/env python3
"""
Interactive chat interface for UniBio AI Agent.
Chat with the agent and give it tasks one by one.
"""
from gemini_agent import GeminiAgent
import sys

def print_separator():
    print("\n" + "="*70 + "\n")

def main():
    print("🧬 UniBio AI Agent - Interactive Chat")
    print("="*70)
    print("Chat with the AI agent about molecular biology tasks!")
    print("Commands:")
    print("  - Type your message to chat")
    print("  - Type 'quit' or 'exit' to end the session")
    print("  - Type 'clear' to clear chat history")
    print("  - Type 'model' to see current model")
    print_separator()
    
    # Initialize agent with Flash model
    print("🚀 Initializing agent with gemini-2.5-flash...")
    try:
        agent = GeminiAgent(model_name='gemini-2.5-flash')
        agent.start_chat()
        print(f"✅ Agent ready! Model: {agent.model_name}")
        print_separator()
    except Exception as e:
        print(f"❌ Failed to initialize agent: {e}")
        sys.exit(1)
    
    # Chat loop
    while True:
        try:
            # Get user input
            user_input = input("You: ").strip()
            
            if not user_input:
                continue
                
            # Handle commands
            if user_input.lower() in ['quit', 'exit']:
                print("\n👋 Goodbye!")
                break
            
            if user_input.lower() == 'clear':
                agent.clear_history()
                print("🗑️  Chat history cleared!")
                print_separator()
                continue
            
            if user_input.lower() == 'model':
                print(f"📊 Current model: {agent.model_name}")
                print_separator()
                continue
            
            # Send message to agent
            print("\n🤖 Agent: ", end="", flush=True)
            result = agent.send_message(user_input)
            
            if result['success']:
                # Print the response
                print(result['response'])
                
                # Show function calls if any
                if result.get('function_calls'):
                    print(f"\n🔧 Tools used: {len(result['function_calls'])}")
                    for fc in result['function_calls']:
                        print(f"   • {fc['function']}")
                
            else:
                print(f"❌ Error: {result.get('error', 'Unknown error')}")
            
            print_separator()
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print_separator()

if __name__ == "__main__":
    main()

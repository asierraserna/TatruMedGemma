import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
}

const parseThoughtTaggedContent = (content: string) => {
  const thoughtStartMatch = /<[^>\n]+>\s*thought\b/i.exec(content);

  if (!thoughtStartMatch || thoughtStartMatch.index == null) {
    return { thought: '', answer: content };
  }

  const startOfThought = thoughtStartMatch.index + thoughtStartMatch[0].length;
  const remaining = content.slice(startOfThought);
  const nextTagMatch = /<[^>\n]+>/.exec(remaining);

  if (!nextTagMatch || nextTagMatch.index == null) {
    return { thought: '', answer: content };
  }

  const thought = remaining.slice(0, nextTagMatch.index).trim();
  const answer = remaining.slice(nextTagMatch.index + nextTagMatch[0].length).trim();

  return { thought, answer };
};

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [showThought, setShowThought] = useState(false);

  const parsedContent = useMemo(() => {
    if (isUser) {
      return { thought: '', answer: message.content };
    }

    return parseThoughtTaggedContent(message.content);
  }, [isUser, message.content]);

  const renderedText = parsedContent.answer || message.content;
  
  return (
    <View style={[
      styles.container, 
      isUser ? styles.userContainer : styles.assistantContainer 
    ]}>
      {message.imageUri && (
        <Image source={{ uri: message.imageUri }} style={styles.imagePreview} resizeMode="cover" />
      )}
      <View style={[
        styles.bubble, 
        isUser ? styles.userBubble : styles.assistantBubble 
      ]}>
        {!isUser && !!parsedContent.thought && (
          <View style={styles.thoughtContainer}>
            <TouchableOpacity onPress={() => setShowThought((current) => !current)}>
              <Text style={styles.thoughtToggleText}>
                {showThought ? 'Hide Thinking Process' : 'Show Thinking Process'}
              </Text>
            </TouchableOpacity>

            {showThought && (
              <View style={styles.thoughtBody}>
                <Markdown style={assistantMarkdownStyles}>{parsedContent.thought}</Markdown>
              </View>
            )}
          </View>
        )}
        <Markdown
          style={isUser ? userMarkdownStyles : assistantMarkdownStyles}
        >
          {renderedText}
        </Markdown>
      </View>
      <Text style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 10,
    flexDirection: 'column',
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    padding: 10,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#007AFF', // iOS blue or similar
    borderTopRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: '#E5E5EA', // Light gray
    borderTopLeftRadius: 2,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: '#8e8e93',
    marginTop: 2,
  },
  imagePreview: {
    width: 220,
    height: 160,
    borderRadius: 10,
    marginBottom: 6,
  },
  thoughtContainer: {
    marginBottom: 8,
  },
  thoughtToggleText: {
    color: '#444',
    fontSize: 12,
    fontWeight: '700',
  },
  thoughtBody: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#efeff4',
    borderRadius: 8,
  },
});

const assistantMarkdownStyles = StyleSheet.create({
  body: {
    color: '#000',
    fontSize: 16,
    lineHeight: 22,
    margin: 0,
    padding: 0,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  heading1: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 6,
  },
  bullet_list: {
    marginTop: 2,
    marginBottom: 8,
  },
  ordered_list: {
    marginTop: 2,
    marginBottom: 8,
  },
  code_inline: {
    backgroundColor: '#dcdce0',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    color: '#1c1c1e',
  },
  code_block: {
    backgroundColor: '#dcdce0',
    borderRadius: 8,
    padding: 10,
    color: '#1c1c1e',
    marginTop: 4,
    marginBottom: 8,
  },
  fence: {
    backgroundColor: '#dcdce0',
    borderRadius: 8,
    padding: 10,
    color: '#1c1c1e',
    marginTop: 4,
    marginBottom: 8,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#8e8e93',
    paddingLeft: 10,
    opacity: 0.9,
  },
  link: {
    color: '#0059d6',
    textDecorationLine: 'underline',
  },
  hr: {
    backgroundColor: '#c7c7cc',
    height: 1,
    marginVertical: 10,
  },
});

const userMarkdownStyles = StyleSheet.create({
  body: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    margin: 0,
    padding: 0,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  heading1: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 8,
    color: '#fff',
  },
  heading2: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 8,
    color: '#fff',
  },
  heading3: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 6,
    color: '#fff',
  },
  bullet_list: {
    marginTop: 2,
    marginBottom: 8,
  },
  ordered_list: {
    marginTop: 2,
    marginBottom: 8,
  },
  code_inline: {
    backgroundColor: '#4a90ff',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    color: '#fff',
  },
  code_block: {
    backgroundColor: '#4a90ff',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    marginTop: 4,
    marginBottom: 8,
  },
  fence: {
    backgroundColor: '#4a90ff',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    marginTop: 4,
    marginBottom: 8,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#d1e3ff',
    paddingLeft: 10,
    opacity: 0.95,
  },
  link: {
    color: '#e5f1ff',
    textDecorationLine: 'underline',
  },
  hr: {
    backgroundColor: '#d1e3ff',
    height: 1,
    marginVertical: 10,
  },
});

export default MessageItem;

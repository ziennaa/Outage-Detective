import React, { useState } from 'react';
import { TimelineEvent, Hypothesis } from '../types';
import { IconActivity, IconTerminal, IconDocument, IconClipboard } from './Icons';

const Card = ({ 
  title, 
  icon: Icon, 
  children, 
  className = "", 
  contentToCopy 
}: { 
  title: string, 
  icon: any, 
  children: React.ReactNode, 
  className?: string,
  contentToCopy?: string 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!contentToCopy) return;
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-neutral-950 border border-neutral-900 rounded-sm flex flex-col ${className}`}>
      <div className="px-4 py-3 border-b border-neutral-900 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-neutral-500" />
          <h3 className="text-base font-bold text-neutral-300 uppercase tracking-wide">{title}</h3>
        </div>
        {contentToCopy && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-neutral-500 hover:text-white transition-colors rounded-sm border border-transparent hover:border-neutral-800"
            title="Copy content"
          >
            {copied ? (
              <span className="text-white">Copied!</span>
            ) : (
              <>
                <IconClipboard className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>
      <div className="p-0">
        {children}
      </div>
    </div>
  );
};

export const TimelineSection = ({ events }: { events: TimelineEvent[] }) => (
  <Card title="Incident Timeline" icon={IconActivity}>
    <div className="p-6">
      <div className="relative border-l border-neutral-800 ml-1.5 space-y-6">
        {events.map((event, idx) => (
          <div key={idx} className="ml-6 relative group">
            <div className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-neutral-600 ring-4 ring-neutral-950 group-hover:bg-neutral-300 transition-colors"></div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
              <span className="text-sm font-mono font-medium text-neutral-500 whitespace-nowrap">
                {event.timestamp}
              </span>
              <p className="text-base text-neutral-300 leading-relaxed mt-1 sm:mt-0">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Card>
);

export const HypothesesSection = ({ hypotheses }: { hypotheses: Hypothesis[] }) => (
  <Card title="Root Cause Hypotheses" icon={IconActivity}>
    <div className="divide-y divide-neutral-900">
      {hypotheses.map((h, idx) => (
        <div key={idx} className="p-5 hover:bg-neutral-900/30 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-base text-neutral-200">{h.title}</h4>
            <span className={`px-2 py-0.5 text-xs uppercase font-bold tracking-wider border rounded-sm ${
              h.likelihood === 'High' ? 'border-neutral-200 text-neutral-200' :
              h.likelihood === 'Medium' ? 'border-neutral-600 text-neutral-400' :
              'border-neutral-800 text-neutral-600'
            }`}>
              {h.likelihood}
            </span>
          </div>
          <p className="text-sm text-neutral-500 leading-relaxed">{h.description}</p>
        </div>
      ))}
    </div>
  </Card>
);

export const CommandsSection = ({ commands }: { commands: string[] }) => (
  <Card title="Suggested Commands" icon={IconTerminal} contentToCopy={commands.join('\n')}>
    <div className="bg-black font-mono text-[15px] divide-y divide-neutral-900">
      {commands.map((cmd, idx) => (
        <div key={idx} className="flex group hover:bg-neutral-900 transition-colors">
          <div className="px-4 py-3 text-neutral-700 select-none bg-neutral-950 border-r border-neutral-900">
            $
          </div>
          <div className="flex-1 px-4 py-3 text-neutral-300 flex items-center justify-between">
            <span>{cmd}</span>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

export const PostmortemSection = ({ content }: { content: string }) => (
  <Card title="Postmortem Draft" icon={IconDocument} contentToCopy={content}>
    <div className="p-6 bg-neutral-950">
        <div className="prose prose-invert prose-base max-w-none text-neutral-400 prose-headings:text-neutral-200 prose-headings:font-bold prose-a:text-white prose-a:underline prose-code:text-neutral-300 prose-code:font-mono prose-code:bg-neutral-900 prose-code:px-1 prose-code:rounded-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-black prose-pre:border prose-pre:border-neutral-900 prose-pre:rounded-sm prose-strong:text-neutral-200">
          {content}
        </div>
    </div>
  </Card>
);
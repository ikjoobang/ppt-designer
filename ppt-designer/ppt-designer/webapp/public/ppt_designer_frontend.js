/**
 * PPT Professional Designer - Frontend System
 * JavaScript/React implementation for web application
 */

// ============================================================================
// DATA MODELS
// ============================================================================

class Question {
    constructor(data) {
        this.questionId = data.question_id;
        this.questionText = data.question_text;
        this.questionType = data.question_type;
        this.required = data.required;
        this.weight = data.weight;
        this.options = data.options || [];
        this.followUp = data.follow_up || null;
        this.placeholder = data.placeholder || null;
    }
}

class UserResponse {
    constructor(questionId, response, additionalDetails = null) {
        this.questionId = questionId;
        this.response = response;
        this.additionalDetails = additionalDetails;
        this.timestamp = new Date();
    }
}

class TemplateRecommendation {
    constructor(data) {
        this.templateName = data.template_name;
        this.templateUrl = data.template_url;
        this.matchScore = data.match_score;
        this.styleTags = data.style_tags;
        this.pros = data.pros;
        this.cons = data.cons;
        this.customizationDifficulty = data.customization_difficulty;
        this.previewImage = data.preview_image || null;
    }
}

// ============================================================================
// MAIN SYSTEM CLASS
// ============================================================================

class PPTDesignerSystem {
    constructor(configData) {
        this.config = configData;
        this.userResponses = new Map();
        this.currentPhase = 1;
        this.currentSection = 1;
        this.recommendations = [];
    }

    /**
     * Get all questions from all phases
     */
    getAllQuestions() {
        const questions = [];
        
        this.config.workflow_phases.forEach(phase => {
            phase.sections.forEach(section => {
                section.strategic_questions.forEach(qData => {
                    questions.push(new Question(qData));
                });
            });
        });
        
        return questions;
    }

    /**
     * Get questions for a specific phase
     */
    getQuestionsByPhase(phaseId) {
        const questions = [];
        const phase = this.config.workflow_phases[phaseId - 1];
        
        if (!phase) return questions;
        
        phase.sections.forEach(section => {
            section.strategic_questions.forEach(qData => {
                questions.push(new Question(qData));
            });
        });
        
        return questions;
    }

    /**
     * Get questions for a specific section
     */
    getQuestionsBySection(phaseId, sectionId) {
        const phase = this.config.workflow_phases[phaseId - 1];
        if (!phase) return [];
        
        const section = phase.sections.find(s => s.section_id === sectionId);
        if (!section) return [];
        
        return section.strategic_questions.map(qData => new Question(qData));
    }

    /**
     * Submit a user response
     */
    submitResponse(questionId, response, additionalDetails = null) {
        const userResponse = new UserResponse(questionId, response, additionalDetails);
        this.userResponses.set(questionId, userResponse);
        
        // Save to localStorage for persistence
        this.saveToLocalStorage();
        
        return true;
    }

    /**
     * Get a specific response
     */
    getResponse(questionId) {
        return this.userResponses.get(questionId);
    }

    /**
     * Calculate weighted profile scores
     */
    calculateProfileScore() {
        const scores = {
            content_goals: 0,
            audience_context: 0,
            design_preferences: 0,
            technical_requirements: 0,
            timeline_resources: 0,
            scalability: 0
        };

        // Map question prefixes to score categories
        const categoryMapping = {
            'q1.1': 'content_goals',
            'q1.2': 'audience_context',
            'q1.3': 'design_preferences',
            'q2.1': 'design_preferences',
            'q2.2': 'technical_requirements',
            'q3.1': 'content_goals',
            'q3.2': 'audience_context',
            'q4.1': 'technical_requirements',
            'q4.2': 'technical_requirements',
            'q5.1': 'timeline_resources',
            'q5.2': 'scalability'
        };

        const maxScores = this.config.scoring_system.weight_distribution;

        this.userResponses.forEach((response, questionId) => {
            // Extract category from question_id
            const prefix = questionId.split('.').slice(0, 2).join('.');
            const category = categoryMapping[prefix];

            if (category && response.response) {
                const question = this.findQuestion(questionId);
                if (question) {
                    const scoreContribution = question.weight / 10.0;
                    scores[category] += scoreContribution;
                }
            }
        });

        // Normalize scores
        Object.keys(scores).forEach(category => {
            const maxScore = maxScores[category];
            scores[category] = Math.min(scores[category] * 2, maxScore);
        });

        return scores;
    }

    /**
     * Find question by ID
     */
    findQuestion(questionId) {
        for (const phase of this.config.workflow_phases) {
            for (const section of phase.sections) {
                const question = section.strategic_questions.find(
                    q => q.question_id === questionId
                );
                if (question) return question;
            }
        }
        return null;
    }

    /**
     * Get customized direction based on user response
     */
    getCustomizedDirection(phaseId, sectionId, userChoice) {
        const phase = this.config.workflow_phases[phaseId - 1];
        if (!phase) return {};

        const section = phase.sections.find(s => s.section_id === sectionId);
        if (!section) return {};

        const directions = section.customized_directions || {};
        return directions[userChoice] || {};
    }

    /**
     * Generate template search parameters
     */
    generateTemplateSearchQuery() {
        const searchParams = {
            style: [],
            colorSchemes: [],
            features: [],
            industry: null,
            slideCount: null
        };

        // Extract from user responses
        this.userResponses.forEach((response, questionId) => {
            if (questionId.includes('q2.1.1')) {
                searchParams.style.push(response.response.toLowerCase());
            } else if (questionId.includes('q1.3.2')) {
                searchParams.colorSchemes.push(response.response);
            } else if (questionId.includes('q3.1.1')) {
                searchParams.slideCount = response.response;
            }
        });

        return searchParams;
    }

    /**
     * Calculate template match score
     */
    calculateTemplateMatchScore(templateData) {
        const matchFactors = {
            styleMatch: 0,
            colorMatch: 0,
            functionalityMatch: 0,
            technicalCompatibility: 0
        };

        // Style matching (25 points)
        const userStyle = this.getResponse('q2.1.1');
        if (userStyle && templateData.style_tags.includes(userStyle.response.toLowerCase())) {
            matchFactors.styleMatch = 25;
        }

        // Color matching (20 points)
        const userColor = this.getResponse('q1.3.2');
        if (userColor && templateData.color_schemes.includes(userColor.response)) {
            matchFactors.colorMatch = 20;
        }

        // Functionality matching (30 points)
        const userGoal = this.getResponse('q1.1.1');
        if (userGoal && templateData.suitable_for.includes(userGoal.response)) {
            matchFactors.functionalityMatch = 30;
        }

        // Technical compatibility (25 points)
        const userVersion = this.getResponse('q2.2.1');
        if (userVersion && templateData.compatible_versions.includes(userVersion.response)) {
            matchFactors.technicalCompatibility = 25;
        }

        const finalScore = Object.values(matchFactors).reduce((a, b) => a + b, 0);
        return Math.min(finalScore, 100);
    }

    /**
     * Generate template recommendations
     */
    generateRecommendations(templatesDatabase) {
        const recommendations = templatesDatabase.map(template => {
            const matchScore = this.calculateTemplateMatchScore(template);
            
            return new TemplateRecommendation({
                template_name: template.name,
                template_url: template.url,
                match_score: matchScore,
                style_tags: template.style_tags || [],
                pros: template.pros || [],
                cons: template.cons || [],
                customization_difficulty: template.difficulty || 'medium',
                preview_image: template.preview_image
            });
        });

        // Sort by match score
        recommendations.sort((a, b) => b.matchScore - a.matchScore);
        this.recommendations = recommendations;

        return recommendations.slice(0, 10); // Top 10
    }

    /**
     * Generate implementation plan
     */
    generateImplementationPlan() {
        const timeline = this.getResponse('q5.1.1');
        const experience = this.getResponse('q5.1.2');

        const plan = {
            timeline: timeline ? timeline.response : '1주',
            experienceLevel: experience ? experience.response : '중급자',
            phases: [],
            resourcesNeeded: [],
            estimatedHours: 0
        };

        if (timeline) {
            const timelineKey = {
                '1일': 'tight_timeline_1day',
                '1주': 'standard_timeline_1week',
                '1개월': 'extended_timeline_1month'
            }[timeline.response] || 'standard_timeline_1week';

            const roadmap = this.config.workflow_phases[4].sections[0]
                .implementation_roadmaps[timelineKey] || {};
            
            plan.phases = roadmap.steps || [];
            plan.resourcesNeeded = [roadmap.resources || ''];
            plan.customizationLevel = roadmap.customization_level || 'moderate';
        }

        return plan;
    }

    /**
     * Calculate questionnaire progress
     */
    getProgressPercentage() {
        const allQuestions = this.getAllQuestions();
        const requiredQuestions = allQuestions.filter(q => q.required);

        const answeredRequired = requiredQuestions.filter(q =>
            this.userResponses.has(q.questionId)
        ).length;

        if (requiredQuestions.length === 0) return 100;

        return (answeredRequired / requiredQuestions.length) * 100;
    }

    /**
     * Export user profile
     */
    exportUserProfile() {
        const responses = {};
        this.userResponses.forEach((response, questionId) => {
            responses[questionId] = {
                response: response.response,
                details: response.additionalDetails,
                timestamp: response.timestamp.toISOString()
            };
        });

        return {
            profileId: `profile_${Date.now()}`,
            createdAt: new Date().toISOString(),
            responses: responses,
            profileScores: this.calculateProfileScore(),
            recommendations: this.recommendations.slice(0, 5).map(rec => ({
                name: rec.templateName,
                url: rec.templateUrl,
                score: rec.matchScore
            }))
        };
    }

    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        const data = {
            responses: Array.from(this.userResponses.entries()),
            currentPhase: this.currentPhase,
            currentSection: this.currentSection,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('ppt_designer_session', JSON.stringify(data));
    }

    /**
     * Load from localStorage
     */
    loadFromLocalStorage() {
        const data = localStorage.getItem('ppt_designer_session');
        if (!data) return false;

        try {
            const parsed = JSON.parse(data);
            this.userResponses = new Map(parsed.responses.map(([key, value]) => 
                [key, Object.assign(new UserResponse(), value)]
            ));
            this.currentPhase = parsed.currentPhase;
            this.currentSection = parsed.currentSection;
            return true;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return false;
        }
    }

    /**
     * Clear session
     */
    clearSession() {
        this.userResponses.clear();
        this.currentPhase = 1;
        this.currentSection = 1;
        this.recommendations = [];
        localStorage.removeItem('ppt_designer_session');
    }
}

// ============================================================================
// REACT COMPONENTS
// ============================================================================

/**
 * Main App Component
 */
const PPTDesignerApp = () => {
    const [system, setSystem] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [currentPhase, setCurrentPhase] = React.useState(1);
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        // Load configuration
        fetch('/api/config')
            .then(res => res.json())
            .then(config => {
                const newSystem = new PPTDesignerSystem(config);
                newSystem.loadFromLocalStorage();
                setSystem(newSystem);
                setProgress(newSystem.getProgressPercentage());
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load config:', err);
                setLoading(false);
            });
    }, []);

    const handleResponseSubmit = (questionId, response, details) => {
        if (system) {
            system.submitResponse(questionId, response, details);
            setProgress(system.getProgressPercentage());
        }
    };

    const handlePhaseComplete = () => {
        if (currentPhase < 5) {
            setCurrentPhase(currentPhase + 1);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="ppt-designer-app">
            <Header progress={progress} />
            <PhaseNavigation 
                currentPhase={currentPhase} 
                onPhaseChange={setCurrentPhase}
            />
            <QuestionnaireSection
                system={system}
                phaseId={currentPhase}
                onResponseSubmit={handleResponseSubmit}
                onPhaseComplete={handlePhaseComplete}
            />
            {progress === 100 && (
                <RecommendationsPanel system={system} />
            )}
        </div>
    );
};

/**
 * Header Component with Progress Bar
 */
const Header = ({ progress }) => {
    return (
        <header className="app-header">
            <h1>PPT Professional Designer</h1>
            <p className="subtitle">AI 기반 맞춤형 PPT 템플릿 추천 시스템</p>
            <ProgressBar percentage={progress} />
        </header>
    );
};

/**
 * Progress Bar Component
 */
const ProgressBar = ({ percentage }) => {
    return (
        <div className="progress-bar-container">
            <div className="progress-bar">
                <div 
                    className="progress-fill" 
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="progress-text">{percentage.toFixed(0)}% 완료</span>
        </div>
    );
};

/**
 * Phase Navigation Component
 */
const PhaseNavigation = ({ currentPhase, onPhaseChange }) => {
    const phases = [
        { id: 1, name: '콘텐츠 분석', icon: '📊' },
        { id: 2, name: '템플릿 선호도', icon: '🎨' },
        { id: 3, name: '슬라이드 구조', icon: '📑' },
        { id: 4, name: '기술 최적화', icon: '⚙️' },
        { id: 5, name: '실행 전략', icon: '🚀' }
    ];

    return (
        <nav className="phase-navigation">
            {phases.map(phase => (
                <button
                    key={phase.id}
                    className={`phase-button ${currentPhase === phase.id ? 'active' : ''}`}
                    onClick={() => onPhaseChange(phase.id)}
                >
                    <span className="phase-icon">{phase.icon}</span>
                    <span className="phase-name">{phase.name}</span>
                </button>
            ))}
        </nav>
    );
};

/**
 * Questionnaire Section Component
 */
const QuestionnaireSection = ({ system, phaseId, onResponseSubmit, onPhaseComplete }) => {
    const questions = system.getQuestionsByPhase(phaseId);
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            onPhaseComplete();
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="questionnaire-section">
            <QuestionCard
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                onResponseSubmit={onResponseSubmit}
                existingResponse={system.getResponse(currentQuestion.questionId)}
            />
            <NavigationButtons
                onNext={handleNext}
                onPrevious={handlePrevious}
                isFirst={currentQuestionIndex === 0}
                isLast={currentQuestionIndex === questions.length - 1}
            />
        </div>
    );
};

/**
 * Question Card Component
 */
const QuestionCard = ({ question, questionNumber, totalQuestions, onResponseSubmit, existingResponse }) => {
    const [response, setResponse] = React.useState(existingResponse?.response || '');
    const [details, setDetails] = React.useState(existingResponse?.additionalDetails || '');

    const handleSubmit = () => {
        onResponseSubmit(question.questionId, response, details);
    };

    React.useEffect(() => {
        handleSubmit();
    }, [response, details]);

    return (
        <div className="question-card">
            <div className="question-header">
                <span className="question-number">
                    질문 {questionNumber} / {totalQuestions}
                </span>
                {question.required && <span className="required-badge">필수</span>}
            </div>
            
            <h3 className="question-text">{question.questionText}</h3>

            {question.questionType === 'single_choice' && (
                <SingleChoiceInput
                    options={question.options}
                    value={response}
                    onChange={setResponse}
                />
            )}

            {question.questionType === 'multiple_choice' && (
                <MultipleChoiceInput
                    options={question.options}
                    value={response}
                    onChange={setResponse}
                />
            )}

            {question.questionType === 'text' && (
                <TextInput
                    value={response}
                    onChange={setResponse}
                    placeholder={question.placeholder}
                />
            )}

            {question.questionType === 'boolean' && (
                <BooleanInput
                    value={response}
                    onChange={setResponse}
                />
            )}

            {question.questionType === 'boolean_with_details' && (
                <>
                    <BooleanInput value={response} onChange={setResponse} />
                    {response && (
                        <TextInput
                            value={details}
                            onChange={setDetails}
                            placeholder={question.followUp}
                        />
                    )}
                </>
            )}
        </div>
    );
};

/**
 * Input Components
 */
const SingleChoiceInput = ({ options, value, onChange }) => {
    return (
        <div className="single-choice-input">
            {options.map(option => (
                <button
                    key={option}
                    className={`choice-button ${value === option ? 'selected' : ''}`}
                    onClick={() => onChange(option)}
                >
                    {option}
                </button>
            ))}
        </div>
    );
};

const MultipleChoiceInput = ({ options, value, onChange }) => {
    const selectedOptions = Array.isArray(value) ? value : [];

    const handleToggle = (option) => {
        const newValue = selectedOptions.includes(option)
            ? selectedOptions.filter(o => o !== option)
            : [...selectedOptions, option];
        onChange(newValue);
    };

    return (
        <div className="multiple-choice-input">
            {options.map(option => (
                <button
                    key={option}
                    className={`choice-button ${selectedOptions.includes(option) ? 'selected' : ''}`}
                    onClick={() => handleToggle(option)}
                >
                    {option}
                </button>
            ))}
        </div>
    );
};

const TextInput = ({ value, onChange, placeholder }) => {
    return (
        <textarea
            className="text-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
        />
    );
};

const BooleanInput = ({ value, onChange }) => {
    return (
        <div className="boolean-input">
            <button
                className={`choice-button ${value === true ? 'selected' : ''}`}
                onClick={() => onChange(true)}
            >
                예
            </button>
            <button
                className={`choice-button ${value === false ? 'selected' : ''}`}
                onClick={() => onChange(false)}
            >
                아니오
            </button>
        </div>
    );
};

/**
 * Navigation Buttons Component
 */
const NavigationButtons = ({ onNext, onPrevious, isFirst, isLast }) => {
    return (
        <div className="navigation-buttons">
            <button
                className="nav-button prev"
                onClick={onPrevious}
                disabled={isFirst}
            >
                ← 이전
            </button>
            <button
                className="nav-button next"
                onClick={onNext}
            >
                {isLast ? '완료' : '다음 →'}
            </button>
        </div>
    );
};

/**
 * Recommendations Panel Component
 */
const RecommendationsPanel = ({ system }) => {
    const [recommendations, setRecommendations] = React.useState([]);
    const [implementationPlan, setImplementationPlan] = React.useState(null);

    React.useEffect(() => {
        // Fetch templates and generate recommendations
        fetch('/api/templates')
            .then(res => res.json())
            .then(templates => {
                const recs = system.generateRecommendations(templates);
                setRecommendations(recs);
            });

        const plan = system.generateImplementationPlan();
        setImplementationPlan(plan);
    }, [system]);

    return (
        <div className="recommendations-panel">
            <h2>🎉 맞춤형 추천 결과</h2>
            
            <div className="recommendations-grid">
                {recommendations.map((rec, index) => (
                    <TemplateCard key={index} recommendation={rec} rank={index + 1} />
                ))}
            </div>

            {implementationPlan && (
                <ImplementationPlanCard plan={implementationPlan} />
            )}

            <ExportButton system={system} />
        </div>
    );
};

/**
 * Template Card Component
 */
const TemplateCard = ({ recommendation, rank }) => {
    const getScoreColor = (score) => {
        if (score >= 90) return '#10b981';
        if (score >= 80) return '#3b82f6';
        if (score >= 70) return '#f59e0b';
        return '#6b7280';
    };

    return (
        <div className="template-card">
            <div className="template-rank" style={{ backgroundColor: getScoreColor(recommendation.matchScore) }}>
                #{rank}
            </div>
            
            {recommendation.previewImage && (
                <img 
                    src={recommendation.previewImage} 
                    alt={recommendation.templateName}
                    className="template-preview"
                />
            )}

            <h3 className="template-name">{recommendation.templateName}</h3>
            
            <div className="match-score">
                <span className="score-label">매칭 점수</span>
                <span className="score-value" style={{ color: getScoreColor(recommendation.matchScore) }}>
                    {recommendation.matchScore.toFixed(0)}점
                </span>
            </div>

            <div className="template-tags">
                {recommendation.styleTags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                ))}
            </div>

            <div className="pros-cons">
                <div className="pros">
                    <h4>✅ 장점</h4>
                    <ul>
                        {recommendation.pros.map((pro, i) => (
                            <li key={i}>{pro}</li>
                        ))}
                    </ul>
                </div>
                <div className="cons">
                    <h4>⚠️ 단점</h4>
                    <ul>
                        {recommendation.cons.map((con, i) => (
                            <li key={i}>{con}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="difficulty-badge">
                편집 난이도: {recommendation.customizationDifficulty}
            </div>

            <a 
                href={recommendation.templateUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="download-button"
            >
                템플릿 다운로드
            </a>
        </div>
    );
};

/**
 * Implementation Plan Card Component
 */
const ImplementationPlanCard = ({ plan }) => {
    return (
        <div className="implementation-plan-card">
            <h3>📋 실행 계획</h3>
            
            <div className="plan-overview">
                <div className="plan-item">
                    <span className="plan-label">타임라인:</span>
                    <span className="plan-value">{plan.timeline}</span>
                </div>
                <div className="plan-item">
                    <span className="plan-label">경험 수준:</span>
                    <span className="plan-value">{plan.experienceLevel}</span>
                </div>
                <div className="plan-item">
                    <span className="plan-label">커스터마이징:</span>
                    <span className="plan-value">{plan.customizationLevel}</span>
                </div>
            </div>

            <div className="plan-phases">
                <h4>단계별 가이드</h4>
                <ol>
                    {plan.phases.map((phase, index) => (
                        <li key={index}>{phase}</li>
                    ))}
                </ol>
            </div>

            <div className="plan-resources">
                <h4>필요한 리소스</h4>
                <ul>
                    {plan.resourcesNeeded.map((resource, index) => (
                        <li key={index}>{resource}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

/**
 * Export Button Component
 */
const ExportButton = ({ system }) => {
    const handleExport = () => {
        const profile = system.exportUserProfile();
        const dataStr = JSON.stringify(profile, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `ppt_profile_${profile.profileId}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    };

    return (
        <button className="export-button" onClick={handleExport}>
            📥 프로필 내보내기
        </button>
    );
};

/**
 * Loading Spinner Component
 */
const LoadingSpinner = () => {
    return (
        <div className="loading-spinner">
            <div className="spinner"></div>
            <p>시스템 로딩 중...</p>
        </div>
    );
};

// ============================================================================
// EXPORT
// ============================================================================

// For ES6 modules
export {
    PPTDesignerSystem,
    Question,
    UserResponse,
    TemplateRecommendation,
    PPTDesignerApp
};

// For CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PPTDesignerSystem,
        Question,
        UserResponse,
        TemplateRecommendation,
        PPTDesignerApp
    };
}

"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Trash2, PlusCircle, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/utils/api";
import dynamic from 'next/dynamic';

const TipTapEditor = dynamic(() => import('./TipTapEditor'), {
  ssr: false,
  loading: () => <div className="border rounded-md p-4 h-48">Loading editor...</div>
});

interface Option {
  text: string;
  explanation: string;
}

interface Exam {
  id: string;
  name: string;
}

interface ModelAnswer {
  text: string;
  keyPoints: string[];
}

interface RubricCriteria {
  criteria: string;
  points: number;
  description: string;
}

interface Question {
  _id?: string;
  type: 'mcq' | 'descriptive';
  complexity: 'Easy' | 'Moderate' | 'Hard',
  questionText: string;
  // examId?: string;
  options?: Option[];
  correctAnswer?: string;
  // correctExplanation?: string;
  modelAnswer?: ModelAnswer;
  rubric?: RubricCriteria[];
  maxScore?: number;
}

interface EditQuestionDialogProps {
  id: string;
  chapterId: string,
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  question: Question;
}

interface FormData extends Question {
  [key: string]: any;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export function EditQuestionDialog({ 
  isOpen, 
  id,
  chapterId,
  onClose, 
  onSuccess, 
  question 
}: EditQuestionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [images, setImages] = useState<File[]>([]);

  const [formData, setFormData] = useState<FormData>(() => {
    const baseData = {
      ...question,
      // examId: question.examId || id
      chapterId,
      images: []
    };

    if (question.type === 'mcq') {
      return {
        ...baseData,
        options: question.options || [{ text: '', explanation: '' }, { text: '', explanation: '' }],
        correctAnswer: question.correctAnswer || '',
        // correctExplanation: question.correctExplanation || '',
        maxScore: question.maxScore || 1
      };
    }

    return {
      ...baseData,
      modelAnswer: {
        text: question.modelAnswer?.text || '',
        keyPoints: question.modelAnswer?.keyPoints || ['']
      },
      rubric: question.rubric || [{ criteria: '', points: 1, description: '' }],
      maxScore: question.maxScore || 5
    };
  });

  // useEffect(() => {
  //   const fetchExams = async () => {
  //     try {
  //       const response = await api.get<ApiResponse<Exam[]>>('/exams');
  //       if (response.data) {
  //         setExams(response.data);
  //         console.log(response.data)
  //       }
  //     } catch (err) {
  //       console.error('Failed to fetch exams:', err);
  //       setError('Failed to load exams');
  //     }
  //   };

  //   fetchExams();
  // }, []);

  const handleExamChange = (examId: string) => {
    setFormData(prev => ({
      ...prev,
      examId
    }));
    setError("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    const updateFormData = (prev: FormData) => {
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev[parent] || {}),
            [child]: value,
          },
        };
      }
      
      return {
        ...prev,
        [name]: value,
      };
    };

    setFormData(updateFormData);
    setError("");
  };

  // Handler for question text rich text editor changes
  const handleQuestionTextChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      questionText: content
    }));
    setError("");
  };

  // Handler for rich text editor changes for model answer
  const handleRichTextChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      modelAnswer: {
        ...(prev.modelAnswer || { text: '', keyPoints: [] }),
        text: content
      }
    }));
    setError("");
  };

  const handleOptionChange = (index: number, field: 'text' | 'explanation', value: string) => {
    setFormData(prev => {
      if (prev.type !== 'mcq') return prev;
      
      const updatedOptions = (prev.options || []).map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      );
      
      return {
        ...prev,
        options: updatedOptions,
        // Clear correct answer if the selected option text changes
        correctAnswer: field === 'text' && prev.correctAnswer === prev.options?.[index].text 
          ? value 
          : prev.correctAnswer
      };
    });
  };

  const handleAddOption = () => {
    setFormData(prev => {
      if (prev.type !== 'mcq') return prev;
      
      return {
        ...prev,
        options: [
          ...(prev.options || []),
          { text: '', explanation: '' }
        ]
      };
    });
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => {
      if (prev.type !== 'mcq') return prev;
      
      const updatedOptions = (prev.options || []).filter((_, i) => i !== index);
      
      return {
        ...prev,
        options: updatedOptions,
        // Clear correct answer if removed option was selected
        correctAnswer: prev.correctAnswer === prev.options?.[index].text 
          ? '' 
          : prev.correctAnswer
      };
    });
  };

  const handleKeyPointChange = (index: number, value: string) => {
    setFormData(prev => {
      if (prev.type !== 'descriptive') return prev;
      
      return {
        ...prev,
        modelAnswer: {
          ...(prev.modelAnswer || { text: '', keyPoints: [] }),
          keyPoints: (prev.modelAnswer?.keyPoints || []).map((point, i) => 
            i === index ? value : point
          ),
        },
      };
    });
  };

  const handleAddKeyPoint = () => {
    setFormData(prev => {
      if (prev.type !== 'descriptive') return prev;
      
      return {
        ...prev,
        modelAnswer: {
          ...(prev.modelAnswer || { text: '', keyPoints: [] }),
          keyPoints: [
            ...(prev.modelAnswer?.keyPoints || []),
            ''
          ]
        }
      };
    });
  };

  const handleRemoveKeyPoint = (index: number) => {
    setFormData(prev => {
      if (prev.type !== 'descriptive') return prev;
      
      return {
        ...prev,
        modelAnswer: {
          ...(prev.modelAnswer || { text: '', keyPoints: [] }),
          keyPoints: (prev.modelAnswer?.keyPoints || []).filter((_, i) => i !== index)
        }
      };
    });
  };

  const handleRubricChange = (index: number, field: keyof RubricCriteria, value: string | number) => {
    setFormData(prev => {
      if (prev.type !== 'descriptive') return prev;
      
      const updatedRubric = (prev.rubric || []).map((criteria, i) => 
        i === index ? { ...criteria, [field]: value } : criteria
      );

      const calculatedMaxScore = updatedRubric.reduce((total, criteria) => 
        total + Number(criteria.points || 0), 0);
      
      return {
        ...prev,
        rubric: updatedRubric,
        maxScore: calculatedMaxScore
      };
    });
  };

  const handleRemoveRubricCriteria = (index: number) => {
    setFormData(prev => {
      if (prev.type !== 'descriptive') return prev;
      
      const updatedRubric = (prev.rubric || []).filter((_, i) => i !== index);

      const calculatedMaxScore = updatedRubric.reduce((total, criteria) => 
        total + Number(criteria.points || 0), 0);
      
      return {
        ...prev,
        rubric: updatedRubric,
        maxScore: calculatedMaxScore
      };
    });
  };

  const handleAddRubricCriteria = () => {
    setFormData(prev => {
      if (prev.type !== 'descriptive') return prev;
      
      const newCriteria = { criteria: '', points: 1, description: '' };
      const updatedRubric = [...(prev.rubric || []), newCriteria];

      const calculatedMaxScore = updatedRubric.reduce((total, criteria) => 
        total + Number(criteria.points || 0), 0);
      
      return {
        ...prev,
        rubric: updatedRubric,
        maxScore: calculatedMaxScore
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // console.log(formData)

    // if (!formData.examId) {
    //   setError("Please select an exam");
    //   setIsLoading(false);
    //   return;
    // }

    // Check for required complexity
    if (!['Easy', 'Moderate', 'Hard'].includes(formData.complexity)) {
      setError("Please select a complexity level");
      setIsLoading(false);
      return;
    }

    // Check for empty question text (strip HTML)
    const questionTextContent = formData.questionText.replace(/<[^>]*>/g, '').trim();
    if (!questionTextContent) {
      setError("Question text cannot be empty");
      setIsLoading(false);
      return;
    }

    if (formData.type === 'mcq') {
      const validAnswers = (formData.options || []).map((_, i) => String.fromCharCode(65 + i));
      if (!formData.correctAnswer || !validAnswers.includes(formData.correctAnswer)) {
        setError("Please select a correct answer");
        setIsLoading(false);
        return;
      }



      if ((formData.options || []).some(opt => !opt.explanation.trim())) {
        setError("Each option must have an explanation");
        setIsLoading(false);
        return;
      }

      // if (!formData.correctExplanation?.trim()) {
      //   setError("Please provide an overall explanation for the correct answer");
      //   setIsLoading(false);
      //   return;
      // }
    } else if (formData.type === 'descriptive') {
      // For rich text editor, check if there's actual content without HTML tags
      const textContent = formData.modelAnswer?.text.replace(/<[^>]*>/g, '').trim();
      if (!textContent) {
        setError("Model answer text cannot be empty");
        setIsLoading(false);
        return;
      }

      if (!formData.modelAnswer?.keyPoints?.length || 
          formData.modelAnswer.keyPoints.some(point => !point.trim())) {
        setError("Please provide at least one non-empty key point");
        setIsLoading(false);
        return;
      }

      if (!formData.rubric?.length) {
        setError("Please add at least one rubric criteria");
        setIsLoading(false);
        return;
      }

      if (formData.rubric.some(criteria => !criteria.criteria.trim())) {
        setError("All rubric criteria must have a name");
        setIsLoading(false);
        return;
      }

      const rubricTotalPoints = formData.rubric.reduce((total, criteria) => 
        total + Number(criteria.points || 0), 0);
      
      if (rubricTotalPoints !== formData.maxScore) {
        setError(`Rubric total points (${rubricTotalPoints}) must match max score (${formData.maxScore})`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "images") return; 

        if (Array.isArray(value)) {
          if (key === "options") {
            value.forEach((v, index) => {
              const updatedOption = { ...v, text: String.fromCharCode(65 + index) };
              payload.append(`${key}[]`, JSON.stringify(updatedOption));
            });
          } else if (key === "rubric") {
            value.forEach((v) => payload.append(`${key}[]`, JSON.stringify(v)));
          } else {
            value.forEach((v) => payload.append(`${key}[]`, v));
          }
        } else if (key === "modelAnswer") {
          payload.append(key, JSON.stringify(value));
        } else {
          payload.append(key, value as string);
        }
      });

      images.forEach((file) => {
        payload.append("images", file);
      });
      
      let response;
      if (!question._id) {
        // if (!formData.examId) {
        //   throw new Error("Exam ID is required for creating new questions");
        // }
        response = await api.post<ApiResponse<Question>>(`/papers/${id}/questions`, payload);
      } else {
        response = await api.put<ApiResponse<Question>>(`/questions/${question._id}`, payload);
      }

      if (!response) {
        throw new Error("Failed to save question");
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save question");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...selectedFiles]);
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveImageHard = async (index: number, url: string) => {
    try {

      const response = await api.delete(`/questions/${question._id}/delete-image/${encodeURIComponent(url)}`);
    
      if (!response) {
        throw new Error("Failed to delete image");
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setIsLoading(false);
    }
    setFormData((prevDate) => ({
      ...prevDate,
      images: prevDate.images.filter((image: string, key: number) => key != index)
    }));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] w-full overflow-y-auto flex flex-col [&>button]:z-[100]">
        <div className="sticky top-0 bg-white z-10 border-b pb-4">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {!question._id ? 'Add' : 'Edit'} {formData.type === 'mcq' ? 'Multiple Choice' : 'Descriptive'} Question
            </DialogTitle>
          </DialogHeader>
        </div>

        <form 
          id="question-edit-form"
          onSubmit={handleSubmit} 
          className="flex-grow overflow-y-auto space-y-6 py-4"
        >
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Complexity Dropdown */}
          <div className="space-y-4">
            <Label htmlFor="complexity" className="text-lg">Complexity</Label>
            <Select
              value={formData.complexity || ''}
              onValueChange={value => setFormData(prev => ({ ...prev, complexity: value as 'Easy' | 'Moderate' | 'Hard' }))}
              required
            >
              <SelectTrigger className="w-full focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Select complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <Label htmlFor="questionText" className="text-lg">Question Text</Label>
            {typeof window !== 'undefined' && (
              <TipTapEditor
                content={formData.questionText || ''}
                onChange={handleQuestionTextChange}
              />
            )}
          </div>

          <div className="space-y-4">
            <Label htmlFor="Image" className="text-lg">Question Related Images</Label>
            <div className="flex items-center gap-2">
              <label
                htmlFor="file_input"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors w-full"
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-primary/10 rounded-full">
                    <PlusCircle className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Browse Images</span>
                </div>
                
                <input
                  name="image"
                  onChange={handleImageChange}
                  id="file_input"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  multiple
                  className="hidden"
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              {formData.images.map((image: any, index: number) => (
                <div key={index} style={{ position: "relative" }}>
                  <img
                    src={image}
                    alt={`Preview ${index}`}
                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImageHard(index, image)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors z-[101]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.map((image, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index}`}
                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors z-[101]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {formData.type === "mcq" ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg">Options</Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleAddOption}
                    disabled={(formData.options || []).length >= 6}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                  </Button>
                </div>
                {(formData.options || []).map((option, index) => (
                  <div key={index} className="space-y-3 p-4 border rounded-lg relative">
                    <div className="flex justify-between items-center">
                      <div className="relative flex items-center space-x-2 w-full">
                        <Input
                          value={String.fromCharCode(65 + index)}
                          readOnly
                          className="flex-grow focus-visible:ring-0 focus-visible:ring-offset-0 bg-muted cursor-not-allowed font-medium"
                        />
                        <div className="flex items-center space-x-2">
                          <Label
                            className={
                              !formData.correctAnswer && formData.options && formData.options.length > 0
                                ? "text-red-500"
                                : ""
                            }
                          >
                            Correct
                          </Label>
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={formData.correctAnswer === String.fromCharCode(65 + index)}
                            onChange={() => setFormData(prev => ({
                              ...prev,
                              correctAnswer: String.fromCharCode(65 + index)
                            }))}
                            className={`h-5 w-5 cursor-pointer ${!formData.correctAnswer && formData.options && formData.options.length > 0
                              ? "border-red-500 ring-2 ring-red-200"
                              : ""
                              }`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if ((formData.options || []).length > 2) {
                              handleRemoveOption(index);
                            }
                          }}
                          disabled={(formData.options || []).length <= 2}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive z-[101] cursor-pointer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={option.explanation}
                      onChange={(e) => handleOptionChange(index, 'explanation', e.target.value)}
                      placeholder="Option explanation"
                      rows={2}
                      className="focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                    />
                  </div>
                ))}
              </div>

              {/* <div className="space-y-4">
                <Label htmlFor="correctExplanation" className="text-lg">
                  Overall Correct Answer Explanation
                </Label>
                <Textarea
                  id="correctExplanation"
                  name="correctExplanation"
                  value={formData.correctExplanation}
                  onChange={handleInputChange}
                  rows={3}
                  required
                  placeholder="Provide a comprehensive explanation for the correct answer"
                />
              </div> */}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="modelAnswer" className="text-lg">Model Answer</Label>
                <div className="editor-container">
                  {typeof window !== 'undefined' && (
                    <TipTapEditor
                      content={formData.modelAnswer?.text || ''}
                      onChange={handleRichTextChange}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg">Key Points</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddKeyPoint}
                    disabled={(formData.modelAnswer?.keyPoints || []).length >= 10}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Key Point
                  </Button>
                </div>
                {(formData.modelAnswer?.keyPoints || []).map((point, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={point}
                      onChange={(e) => handleKeyPointChange(index, e.target.value)}
                      placeholder={`Key Point ${index + 1}`}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleRemoveKeyPoint(index)}
                      disabled={(formData.modelAnswer?.keyPoints || []).length <= 1}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg">Rubric</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddRubricCriteria}
                    disabled={(formData.rubric || []).length >= 5}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Rubric Criteria 
                  </Button>
                </div>
                {(formData.rubric || []).map((criteria, index) => (
                  <div key={index} className="space-y-3 p-4 border rounded-lg relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-destructive"
                      onClick={() => handleRemoveRubricCriteria(index)}
                      disabled={(formData.rubric || []).length <= 1}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Criteria</Label>
                        <Input
                          value={criteria.criteria}
                          onChange={(e) => handleRubricChange(index, 'criteria', e.target.value)}
                          placeholder="Evaluation criteria"
                          required
                        />
                      </div>
                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          value={criteria.points}
                          onChange={(e) => handleRubricChange(index, 'points', Number(e.target.value))}
                          min={0}
                          max={formData.maxScore}
                          className="w-24"
                          required
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={criteria.description}
                          onChange={(e) => handleRubricChange(index, 'description', e.target.value)}
                          placeholder="Detailed description of criteria"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Label htmlFor="maxScore" className="text-lg">Max Score</Label>
                <Input
                  id="maxScore"
                  name="maxScore"
                  type="number"
                  value={formData.maxScore}
                  onChange={handleInputChange}
                  min={1}
                  max={20}
                  className="w-24"
                  required
                  readOnly
                />
              </div>
            </div>
          )}
        </form>

        <div className="sticky bottom-0 bg-white z-10 border-t pt-4">
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              size="lg"
              className="w-24"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="question-edit-form"
              disabled={isLoading}
              size="lg"
              className="w-24"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}